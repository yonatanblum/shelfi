import type {
  ShelfAnalysisDiagnostics,
  ShelfAnalysisPhaseTiming,
} from "@/lib/shelf-analysis/analysis-timing";
import { formatBytes } from "@/lib/shelf-analysis/analysis-timing";

type AnalysisLogContext = {
  fileName?: string;
  uploadKey?: string;
};

function logPayload(
  event: string,
  context: AnalysisLogContext,
  details: Record<string, unknown>,
): void {
  console.info("[shelf-analysis]", event, {
    ...context,
    ...details,
  });
}

export function logUploadStarted(
  context: AnalysisLogContext,
  imageSizeBytes: number,
  mimeType: string,
): void {
  logPayload("upload_started", context, {
    imageSizeBytes,
    imageSizeLabel: formatBytes(imageSizeBytes),
    mimeType,
  });
}

export function logFileSaved(
  context: AnalysisLogContext,
  writeFileMs: number,
  uploadKey: string,
): void {
  logPayload("file_saved", context, {
    uploadKey,
    writeFileMs,
  });
}

export function logGeminiStarted(
  context: AnalysisLogContext,
  model: string,
  imageSizeBytes: number,
): void {
  logPayload("gemini_started", context, {
    model,
    imageSizeBytes,
    imageSizeLabel: formatBytes(imageSizeBytes),
  });
}

export function logGeminiCompleted(
  context: AnalysisLogContext,
  geminiMs: number,
  parseMs: number,
  diagnostics: Pick<
    ShelfAnalysisDiagnostics,
    "responseBytes" | "shelvesDetected" | "itemsDetected"
  >,
): void {
  logPayload("gemini_completed", context, {
    geminiMs,
    parseMs,
    ...diagnostics,
  });
}

export function logPersistCompleted(
  context: AnalysisLogContext,
  persistMs: number,
  analysisId: string,
): void {
  logPayload("persist_completed", context, {
    persistMs,
    analysisId,
  });
}

export function logAnalysisCompleted(
  context: AnalysisLogContext,
  timing: ShelfAnalysisPhaseTiming,
  diagnostics: ShelfAnalysisDiagnostics,
): void {
  logPayload("analysis_completed", context, {
    ...timing,
    ...diagnostics,
    imageSizeLabel: formatBytes(diagnostics.imageSizeBytes),
    geminiSharePercent: Math.round((timing.geminiMs / timing.totalMs) * 100),
  });
}

export function logAnalysisFailed(
  context: AnalysisLogContext,
  phase: string,
  error: unknown,
  elapsedMs: number,
): void {
  const message = error instanceof Error ? error.message : "Unknown error";

  console.error("[shelf-analysis]", "analysis_failed", {
    ...context,
    phase,
    elapsedMs,
    message,
  });
}
