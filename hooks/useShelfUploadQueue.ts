"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  analyzeAndPersistSavedShelfImage,
  saveShelfImageForAnalysis,
} from "@/app/actions/shelf-analysis";
import { formatCostUsd } from "@/lib/gemini/gemini-pricing";
import { UPLOAD_CONFIG } from "@/constants/upload-config";
import {
  appendLog,
  computeInFlightProgress,
  computeRemainingMs,
  createLogEntry,
  formatBytes,
  formatDuration,
  formatTimingBreakdown,
  readStoredAverageDurationMs,
  stageFromProgress,
  storeAverageDurationMs,
  type UploadJob,
} from "@/lib/upload/shelf-upload-progress";
import type { ShelfAnalysisRecord } from "@/lib/types/shelf-analysis";

type UseShelfUploadQueueResult = {
  jobs: UploadJob[];
  activeCount: number;
  latestAnalysis: ShelfAnalysisRecord | null;
  enqueueFiles: (files: FileList | File[]) => void;
  isBusy: boolean;
};

function createQueuedJob(fileName: string, estimatedTotalMs: number): UploadJob {
  return {
    id: crypto.randomUUID(),
    fileName,
    stage: "queued",
    progressPercent: 0,
    estimatedRemainingMs: estimatedTotalMs,
    estimatedTotalMs,
    startedAt: null,
    completedAt: null,
    logs: [createLogEntry("Queued — waiting for an available analysis slot.")],
  };
}

function updateJob(
  jobs: UploadJob[],
  jobId: string,
  updater: (job: UploadJob) => UploadJob,
): UploadJob[] {
  return jobs.map((job) => (job.id === jobId ? updater(job) : job));
}

const IN_FLIGHT_STAGES = new Set<UploadJob["stage"]>([
  "uploading",
  "analyzing",
  "saving",
]);

export function useShelfUploadQueue(): UseShelfUploadQueueResult {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<ShelfAnalysisRecord | null>(
    null,
  );

  const jobsRef = useRef(jobs);
  const fileQueueRef = useRef<Map<string, File>>(new Map());
  const reservedJobIdsRef = useRef<Set<string>>(new Set());
  const lastLogAtRef = useRef<Map<string, number>>(new Map());

  jobsRef.current = jobs;

  const patchJob = useCallback((jobId: string, updater: (job: UploadJob) => UploadJob) => {
    setJobs((current) => {
      const next = updateJob(current, jobId, updater);
      jobsRef.current = next;
      return next;
    });
  }, []);

  const runUpload = useCallback(
    async (file: File, jobId: string) => {
      const estimatedTotalMs = readStoredAverageDurationMs();
      const startedAt = Date.now();

      patchJob(jobId, (job) =>
        appendLog(
          {
            ...job,
            stage: "uploading",
            startedAt,
            estimatedTotalMs,
            estimatedRemainingMs: estimatedTotalMs,
            progressPercent: 6,
          },
          `Upload started — ${formatBytes(file.size)} image selected.`,
        ),
      );

      lastLogAtRef.current.set(jobId, startedAt);

      const formData = new FormData();
      formData.append("file", file);

      const saved = await saveShelfImageForAnalysis(formData);

      if (!saved.success) {
        const completedAt = Date.now();
        patchJob(jobId, (job) =>
          appendLog(
            {
              ...job,
              stage: "error",
              progressPercent: 100,
              estimatedRemainingMs: 0,
              completedAt,
              error: saved.error,
            },
            `Upload failed — ${saved.error}`,
          ),
        );
        toast.error(`${file.name}: ${saved.error}`);
        return;
      }

      patchJob(jobId, (job) =>
        appendLog(
          {
            ...job,
            stage: "analyzing",
            progressPercent: 12,
          },
          `Image saved in ${formatDuration(saved.writeFileMs)} — sending to Gemini for shelf extraction.`,
        ),
      );

      patchJob(jobId, (job) =>
        appendLog(
          job,
          `Gemini is analyzing layout, brands, facings, and price tags. This step usually takes the longest.`,
        ),
      );

      lastLogAtRef.current.set(jobId, Date.now());

      const result = await analyzeAndPersistSavedShelfImage(
        saved.uploadKey,
        file.name,
        saved.mimeType,
      );
      const completedAt = Date.now();
      const durationMs = completedAt - startedAt;

      if (!result.success) {
        patchJob(jobId, (job) =>
          appendLog(
            {
              ...job,
              stage: "error",
              progressPercent: 100,
              estimatedRemainingMs: 0,
              completedAt,
              error: result.error,
            },
            `Analysis failed — ${result.error}`,
          ),
        );
        toast.error(`${file.name}: ${result.error}`);
        return;
      }

      const { timing } = result;

      storeAverageDurationMs(durationMs);
      lastLogAtRef.current.delete(jobId);

      patchJob(jobId, (job) =>
        appendLog(
          job,
          `Gemini finished in ${formatDuration(timing.geminiMs)} — ${timing.shelvesDetected} shelves, ${timing.itemsDetected} items (${formatBytes(timing.responseBytes)} JSON)${
            timing.estimatedCostUsd != null
              ? `, est. ${formatCostUsd(timing.estimatedCostUsd)}`
              : ""
          }.`,
        ),
      );

      patchJob(jobId, (job) =>
        appendLog(
          {
            ...job,
            stage: "saving",
            progressPercent: 95,
          },
          `Saved to dashboard in ${formatDuration(timing.persistMs)}.`,
        ),
      );

      patchJob(jobId, (job) =>
        appendLog(
          {
            ...job,
            stage: "complete",
            progressPercent: 100,
            estimatedRemainingMs: 0,
            completedAt,
          },
          `Complete in ${formatDuration(durationMs)} — ${formatTimingBreakdown({
            writeFileMs: saved.writeFileMs,
            geminiMs: timing.geminiMs,
            parseMs: timing.parseMs,
            persistMs: timing.persistMs,
            totalMs: durationMs,
          })}.`,
        ),
      );

      setLatestAnalysis(result.analysis);
      toast.success(
        `${file.name}: ${result.analysis.totalShelvesDetected} shelves analyzed.`,
      );
    },
    [patchJob],
  );

  const pumpQueue = useCallback(() => {
    const currentJobs = jobsRef.current;
    const activeCount = currentJobs.filter(
      (job) => IN_FLIGHT_STAGES.has(job.stage) || reservedJobIdsRef.current.has(job.id),
    ).length;
    const availableSlots = UPLOAD_CONFIG.maxParallelUploads - activeCount;

    if (availableSlots <= 0) {
      return;
    }

    const queuedJobs = currentJobs
      .filter((job) => job.stage === "queued" && !reservedJobIdsRef.current.has(job.id))
      .slice(0, availableSlots);

    for (const job of queuedJobs) {
      const file = fileQueueRef.current.get(job.id);

      if (!file) {
        continue;
      }

      reservedJobIdsRef.current.add(job.id);

      void runUpload(file, job.id).finally(() => {
        reservedJobIdsRef.current.delete(job.id);
        fileQueueRef.current.delete(job.id);
        pumpQueue();
      });
    }
  }, [runUpload]);

  const enqueueFiles = useCallback(
    (files: FileList | File[]) => {
      const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        toast.error("Please upload at least one image file.");
        return;
      }

      const estimatedTotalMs = readStoredAverageDurationMs();
      const newJobs = imageFiles.map((file) => {
        const job = createQueuedJob(file.name, estimatedTotalMs);
        fileQueueRef.current.set(job.id, file);
        return job;
      });

      setJobs((current) => {
        const next = [...newJobs, ...current];
        jobsRef.current = next;
        return next;
      });

      queueMicrotask(() => pumpQueue());
    },
    [pumpQueue],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setJobs((current) => {
        const next = current.map((job) => {
          if (!IN_FLIGHT_STAGES.has(job.stage) || !job.startedAt) {
            return job;
          }

          const elapsedMs = Date.now() - job.startedAt;
          const progressPercent = computeInFlightProgress(
            elapsedMs,
            job.estimatedTotalMs,
          );
          const nextStage = stageFromProgress(progressPercent);
          const estimatedRemainingMs = computeRemainingMs(
            elapsedMs,
            job.estimatedTotalMs,
          );

          let nextJob: UploadJob = {
            ...job,
            stage: nextStage,
            progressPercent,
            estimatedRemainingMs,
          };

          if (nextStage === "saving" && job.stage !== "saving") {
            nextJob = appendLog(nextJob, "Saving structured results to the dashboard.");
          }

          const lastLoggedAt = lastLogAtRef.current.get(job.id) ?? job.startedAt;
          const shouldLogProgress =
            nextStage === "analyzing" &&
            Date.now() - lastLoggedAt >= UPLOAD_CONFIG.logIntervalMs;

          if (shouldLogProgress) {
            lastLogAtRef.current.set(job.id, Date.now());
            nextJob = appendLog(
              nextJob,
              `Still waiting on Gemini (${formatDuration(elapsedMs)} elapsed, ~${formatDuration(estimatedRemainingMs)} left).`,
            );
          }

          return nextJob;
        });

        jobsRef.current = next;
        return next;
      });
    }, UPLOAD_CONFIG.progressTickMs);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeCount = jobs.filter(
    (job) => job.stage === "queued" || IN_FLIGHT_STAGES.has(job.stage),
  ).length;

  return {
    jobs,
    activeCount,
    latestAnalysis,
    enqueueFiles,
    isBusy: activeCount > 0,
  };
}
