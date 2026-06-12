export type GeminiTokenUsage = {
  promptTokenCount: number;
  candidatesTokenCount: number;
  thoughtsTokenCount: number;
  totalTokenCount: number;
};

type ModelPricingRates = {
  inputPerMillion: number;
  outputPerMillion: number;
};

const GEMINI_31_PRO_RATES: ModelPricingRates = {
  inputPerMillion: 2,
  outputPerMillion: 12,
};

const GEMINI_3_FLASH_RATES: ModelPricingRates = {
  inputPerMillion: 0.5,
  outputPerMillion: 3,
};

const GEMINI_25_PRO_RATES: ModelPricingRates = {
  inputPerMillion: 1.25,
  outputPerMillion: 10,
};

const GEMINI_25_FLASH_RATES: ModelPricingRates = {
  inputPerMillion: 0.3,
  outputPerMillion: 2.5,
};

function getModelPricingRates(model: string): ModelPricingRates {
  const normalizedModel = model.toLowerCase();

  if (normalizedModel.includes("gemini-3.1-pro")) {
    return GEMINI_31_PRO_RATES;
  }

  if (normalizedModel.includes("gemini-3")) {
    return GEMINI_3_FLASH_RATES;
  }

  if (normalizedModel.includes("gemini-2.5-pro")) {
    return GEMINI_25_PRO_RATES;
  }

  return GEMINI_25_FLASH_RATES;
}

export function estimateGeminiCostUsd(
  model: string,
  usage: GeminiTokenUsage,
): number {
  const rates = getModelPricingRates(model);
  const outputTokens = usage.candidatesTokenCount + usage.thoughtsTokenCount;

  const inputCost = (usage.promptTokenCount / 1_000_000) * rates.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * rates.outputPerMillion;

  return inputCost + outputCost;
}

export function formatCostUsd(costUsd: number): string {
  if (costUsd < 0.01) {
    return `$${costUsd.toFixed(4)}`;
  }

  return `$${costUsd.toFixed(2)}`;
}

export function extractTokenUsage(
  usageMetadata: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  } | undefined,
): GeminiTokenUsage | null {
  if (!usageMetadata?.promptTokenCount && !usageMetadata?.candidatesTokenCount) {
    return null;
  }

  const promptTokenCount = usageMetadata.promptTokenCount ?? 0;
  const candidatesTokenCount = usageMetadata.candidatesTokenCount ?? 0;
  const thoughtsTokenCount = usageMetadata.thoughtsTokenCount ?? 0;

  return {
    promptTokenCount,
    candidatesTokenCount,
    thoughtsTokenCount,
    totalTokenCount:
      usageMetadata.totalTokenCount ??
      promptTokenCount + candidatesTokenCount + thoughtsTokenCount,
  };
}
