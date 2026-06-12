export const UPLOAD_CONFIG = {
  maxParallelUploads: 3,
  defaultEstimatedAnalysisMs: 90_000,
  progressTickMs: 1_000,
  logIntervalMs: 15_000,
  durationStorageKey: "shelfi-analysis-duration-ms",
} as const;
