import {
  GoogleGenAI,
  PartMediaResolutionLevel,
  ThinkingLevel,
} from "@google/genai";

export const DEFAULT_GEMINI_MODEL = "gemini-3.1-pro-preview";
export const DEFAULT_GEMINI_MEDIA_RESOLUTION = "high";
export const DEFAULT_GEMINI_THINKING_LEVEL = "high";

export type GeminiMediaResolutionSetting = "default" | "low" | "medium" | "high";
export type GeminiThinkingLevelSetting = "minimal" | "low" | "medium" | "high";

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your .env file.",
    );
  }

  return apiKey;
}

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

export function getGeminiMediaResolutionSetting(): GeminiMediaResolutionSetting {
  const value = process.env.GEMINI_MEDIA_RESOLUTION?.trim().toLowerCase();

  if (!value || value === "default") {
    return "default";
  }

  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return DEFAULT_GEMINI_MEDIA_RESOLUTION as GeminiMediaResolutionSetting;
}

export function getGeminiThinkingLevelSetting(): GeminiThinkingLevelSetting {
  const value = process.env.GEMINI_THINKING_LEVEL?.trim().toLowerCase();

  if (!value) {
    return DEFAULT_GEMINI_THINKING_LEVEL as GeminiThinkingLevelSetting;
  }

  if (
    value === "minimal" ||
    value === "low" ||
    value === "medium" ||
    value === "high"
  ) {
    return value;
  }

  return DEFAULT_GEMINI_THINKING_LEVEL as GeminiThinkingLevelSetting;
}

export function isGemini3Model(model: string): boolean {
  return model.toLowerCase().includes("gemini-3");
}

export function resolvePartMediaResolution(
  setting: GeminiMediaResolutionSetting,
): PartMediaResolutionLevel | undefined {
  switch (setting) {
    case "low":
      return PartMediaResolutionLevel.MEDIA_RESOLUTION_LOW;
    case "medium":
      return PartMediaResolutionLevel.MEDIA_RESOLUTION_MEDIUM;
    case "high":
      return PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH;
    default:
      return undefined;
  }
}

export function resolveThinkingLevel(
  setting: GeminiThinkingLevelSetting,
): ThinkingLevel {
  switch (setting) {
    case "minimal":
      return ThinkingLevel.MINIMAL;
    case "low":
      return ThinkingLevel.LOW;
    case "medium":
      return ThinkingLevel.MEDIUM;
    case "high":
      return ThinkingLevel.HIGH;
  }
}

export function createGeminiClient(): GoogleGenAI {
  const mediaResolution = getGeminiMediaResolutionSetting();
  const needsV1Alpha = mediaResolution !== "default";

  return new GoogleGenAI({
    apiKey: getGeminiApiKey(),
    ...(needsV1Alpha ? { apiVersion: "v1alpha" } : {}),
  });
}
