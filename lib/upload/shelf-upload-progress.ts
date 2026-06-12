import { UPLOAD_CONFIG } from "@/constants/upload-config";

export type UploadStage =
  | "queued"
  | "uploading"
  | "analyzing"
  | "saving"
  | "complete"
  | "error";

export type UploadLogEntry = {
  id: string;
  timestamp: number;
  message: string;
};

export type UploadJob = {
  id: string;
  fileName: string;
  stage: UploadStage;
  progressPercent: number;
  estimatedRemainingMs: number | null;
  estimatedTotalMs: number;
  startedAt: number | null;
  completedAt: number | null;
  logs: UploadLogEntry[];
  error?: string;
};

export function createLogEntry(message: string): UploadLogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    message,
  };
}

export function appendLog(
  job: UploadJob,
  message: string,
): UploadJob {
  return {
    ...job,
    logs: [createLogEntry(message), ...job.logs],
  };
}

export function readStoredAverageDurationMs(): number {
  if (typeof window === "undefined") {
    return UPLOAD_CONFIG.defaultEstimatedAnalysisMs;
  }

  const stored = window.localStorage.getItem(UPLOAD_CONFIG.durationStorageKey);
  const parsed = stored ? Number.parseInt(stored, 10) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return UPLOAD_CONFIG.defaultEstimatedAnalysisMs;
  }

  return parsed;
}

export function storeAverageDurationMs(durationMs: number): void {
  if (typeof window === "undefined" || durationMs <= 0) {
    return;
  }

  const previous = readStoredAverageDurationMs();
  const nextAverage = Math.round(previous * 0.7 + durationMs * 0.3);

  window.localStorage.setItem(
    UPLOAD_CONFIG.durationStorageKey,
    String(nextAverage),
  );
}

export function stageFromProgress(progressPercent: number): UploadStage {
  if (progressPercent < 8) {
    return "uploading";
  }

  if (progressPercent < 90) {
    return "analyzing";
  }

  return "saving";
}

export function computeInFlightProgress(
  elapsedMs: number,
  estimatedMs: number,
): number {
  const ratio = elapsedMs / estimatedMs;

  return Math.min(92, Math.max(4, Math.round(ratio * 92)));
}

export function computeRemainingMs(
  elapsedMs: number,
  estimatedMs: number,
): number {
  return Math.max(0, estimatedMs - elapsedMs);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function formatLogTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

export function stageLabel(stage: UploadStage): string {
  switch (stage) {
    case "queued":
      return "Queued";
    case "uploading":
      return "Uploading";
    case "analyzing":
      return "Analyzing with Gemini";
    case "saving":
      return "Saving results";
    case "complete":
      return "Complete";
    case "error":
      return "Failed";
    default: {
      const exhaustiveCheck: never = stage;
      return exhaustiveCheck;
    }
  }
}
