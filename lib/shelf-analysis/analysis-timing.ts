export type ShelfAnalysisPhaseTiming = {
  writeFileMs: number;
  geminiMs: number;
  parseMs: number;
  persistMs: number;
  totalMs: number;
};

export type ShelfAnalysisDiagnostics = {
  imageSizeBytes: number;
  model: string;
  responseBytes: number;
  shelvesDetected: number;
  itemsDetected: number;
  promptTokenCount?: number;
  outputTokenCount?: number;
  thoughtsTokenCount?: number;
  totalTokenCount?: number;
  estimatedCostUsd?: number | null;
};

export type ShelfAnalysisTiming = ShelfAnalysisPhaseTiming &
  ShelfAnalysisDiagnostics;

export type PhaseTimer = {
  elapsedMs: () => number;
  mark: (phase: keyof ShelfAnalysisPhaseTiming) => void;
  finish: () => ShelfAnalysisPhaseTiming;
};

export function createPhaseTimer(startedAt = Date.now()): PhaseTimer {
  const marks: Partial<Record<keyof ShelfAnalysisPhaseTiming, number>> = {
    writeFileMs: 0,
    geminiMs: 0,
    parseMs: 0,
    persistMs: 0,
  };

  let lastMarkAt = startedAt;

  return {
    elapsedMs: () => Date.now() - startedAt,
    mark(phase) {
      const now = Date.now();
      marks[phase] = (marks[phase] ?? 0) + (now - lastMarkAt);
      lastMarkAt = now;
    },
    finish() {
      const totalMs = Date.now() - startedAt;

      return {
        writeFileMs: marks.writeFileMs ?? 0,
        geminiMs: marks.geminiMs ?? 0,
        parseMs: marks.parseMs ?? 0,
        persistMs: marks.persistMs ?? 0,
        totalMs,
      };
    },
  };
}

export async function measureAsync<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const startedAt = Date.now();
  const result = await fn();

  return {
    result,
    durationMs: Date.now() - startedAt,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
