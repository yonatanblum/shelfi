import { createPartFromBase64, createPartFromText } from "@google/genai";

import {
  createGeminiClient,
  getGeminiMediaResolutionSetting,
  getGeminiModelName,
  getGeminiThinkingLevelSetting,
  isGemini3Model,
  resolvePartMediaResolution,
  resolveThinkingLevel,
} from "@/lib/gemini/gemini-config";
import {
  estimateGeminiCostUsd,
  extractTokenUsage,
  formatCostUsd,
  type GeminiTokenUsage,
} from "@/lib/gemini/gemini-pricing";
import { parseShelfAnalysisResponse } from "@/lib/gemini/parse-shelf-analysis-response";
import {
  SHELF_ANALYSIS_PROMPT,
  SHELF_ANALYSIS_RESPONSE_SCHEMA,
} from "@/lib/gemini/shelf-analysis-schema";
import {
  logGeminiCompleted,
  logGeminiStarted,
} from "@/lib/shelf-analysis/analysis-logger";
import { measureAsync } from "@/lib/shelf-analysis/analysis-timing";
import type { ShelfAnalysisResult } from "@/lib/types/shelf-analysis";

export { parseShelfAnalysisResponse } from "@/lib/gemini/parse-shelf-analysis-response";
export {
  DEFAULT_GEMINI_MODEL,
  getGeminiModelName,
} from "@/lib/gemini/gemini-config";

export type AnalyzeShelfImageResult = {
  analysis: ShelfAnalysisResult;
  geminiMs: number;
  parseMs: number;
  model: string;
  imageSizeBytes: number;
  responseBytes: number;
  tokenUsage: GeminiTokenUsage | null;
  estimatedCostUsd: number | null;
};

export async function analyzeShelfImage(
  imageBuffer: Buffer,
  mimeType: string,
  sourceFileName?: string,
): Promise<AnalyzeShelfImageResult> {
  const modelName = getGeminiModelName();
  const mediaResolutionSetting = getGeminiMediaResolutionSetting();
  const thinkingLevelSetting = getGeminiThinkingLevelSetting();
  const ai = createGeminiClient();
  const fileContext = sourceFileName
    ? `\nSource image filename: ${sourceFileName}`
    : "";
  const logContext = { fileName: sourceFileName };

  logGeminiStarted(logContext, modelName, imageBuffer.byteLength, {
    mediaResolution: mediaResolutionSetting,
    thinkingLevel: isGemini3Model(modelName) ? thinkingLevelSetting : undefined,
  });

  const imagePart = createPartFromBase64(
    imageBuffer.toString("base64"),
    mimeType,
    resolvePartMediaResolution(mediaResolutionSetting),
  );

  const { result: geminiResponse, durationMs: geminiMs } = await measureAsync(() =>
    ai.models.generateContent({
      model: modelName,
      contents: [
        createPartFromText(`${SHELF_ANALYSIS_PROMPT}${fileContext}`),
        imagePart,
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: SHELF_ANALYSIS_RESPONSE_SCHEMA,
        ...(isGemini3Model(modelName)
          ? {
              thinkingConfig: {
                thinkingLevel: resolveThinkingLevel(thinkingLevelSetting),
              },
            }
          : {}),
      },
    }),
  );

  const responseText = geminiResponse.text;

  if (!responseText) {
    throw new Error("Gemini returned an empty analysis response.");
  }

  const { result: analysis, durationMs: parseMs } = await measureAsync(async () =>
    parseShelfAnalysisResponse(responseText),
  );

  const normalizedAnalysis: ShelfAnalysisResult = {
    ...analysis,
    source_image: sourceFileName ?? analysis.source_image,
  };

  const itemsDetected = normalizedAnalysis.shelves.reduce(
    (total, shelf) => total + shelf.items.length,
    0,
  );

  const tokenUsage = extractTokenUsage(geminiResponse.usageMetadata);
  const estimatedCostUsd = tokenUsage
    ? estimateGeminiCostUsd(modelName, tokenUsage)
    : null;

  logGeminiCompleted(logContext, geminiMs, parseMs, {
    responseBytes: Buffer.byteLength(responseText, "utf8"),
    shelvesDetected: normalizedAnalysis.shelves.length,
    itemsDetected,
    tokenUsage,
    estimatedCostUsd,
  });

  return {
    analysis: normalizedAnalysis,
    geminiMs,
    parseMs,
    model: modelName,
    imageSizeBytes: imageBuffer.byteLength,
    responseBytes: Buffer.byteLength(responseText, "utf8"),
    tokenUsage,
    estimatedCostUsd,
  };
}

export function formatAnalysisCostLabel(estimatedCostUsd: number | null): string {
  if (estimatedCostUsd === null) {
    return "cost unavailable";
  }

  return formatCostUsd(estimatedCostUsd);
}
