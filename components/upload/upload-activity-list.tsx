"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { UPLOAD_CONFIG } from "@/constants/upload-config";
import {
  formatDuration,
  formatLogTimestamp,
  stageLabel,
  type UploadJob,
} from "@/lib/upload/shelf-upload-progress";
import { cn } from "@/lib/utils";

type UploadActivityListProps = {
  jobs: UploadJob[];
};

function statusTone(stage: UploadJob["stage"]): string {
  switch (stage) {
    case "complete":
      return "text-success";
    case "error":
      return "text-destructive";
    case "queued":
      return "text-muted-foreground";
    default:
      return "text-primary";
  }
}

function UploadActivityItem({ job }: { job: UploadJob }) {
  const [isExpanded, setIsExpanded] = useState(job.stage !== "complete");

  const showProgress = job.stage !== "complete" && job.stage !== "error";
  const remainingLabel =
    job.estimatedRemainingMs !== null && showProgress
      ? formatDuration(job.estimatedRemainingMs)
      : null;

  return (
    <div className="rounded-md border-2 border-foreground bg-card brutal-shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{job.fileName}</p>
          <p className={cn("mt-1 text-xs font-semibold uppercase tracking-wide", statusTone(job.stage))}>
            {stageLabel(job.stage)}
            {remainingLabel ? ` · ~${remainingLabel} left` : null}
          </p>
        </div>

        <button
          type="button"
          className="brutal-press inline-flex items-center gap-1 rounded-md border-2 border-foreground bg-muted px-2 py-1 text-xs font-semibold uppercase tracking-wide"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
        >
          Logs
          {isExpanded ? (
            <ChevronUp className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {showProgress ? (
        <div className="px-4 pb-3">
          <div className="h-2 overflow-hidden rounded-full border border-foreground bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${job.progressPercent}%` }}
              role="progressbar"
              aria-valuenow={job.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Analysis progress for ${job.fileName}`}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {job.progressPercent}% complete
            {remainingLabel ? ` · estimated ${remainingLabel} remaining` : null}
          </p>
        </div>
      ) : null}

      {job.error ? (
        <p className="border-t border-foreground/20 px-4 py-3 text-sm text-destructive">
          {job.error}
        </p>
      ) : null}

      {isExpanded ? (
        <div className="border-t border-foreground/20 bg-muted/30 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Progress Log
          </p>
          <ol className="space-y-2">
            {job.logs.map((log) => (
              <li key={log.id} className="text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  {formatLogTimestamp(log.timestamp)}
                </span>
                <span className="ml-2 text-foreground">{log.message}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

export function UploadActivityList({ jobs }: UploadActivityListProps) {
  if (jobs.length === 0) {
    return null;
  }

  const activeCount = jobs.filter(
    (job) =>
      job.stage === "queued" ||
      job.stage === "uploading" ||
      job.stage === "analyzing" ||
      job.stage === "saving",
  ).length;

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Upload Activity
        </p>
        {activeCount > 0 ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {activeCount} active · up to {UPLOAD_CONFIG.maxParallelUploads} in parallel
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <UploadActivityItem key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
