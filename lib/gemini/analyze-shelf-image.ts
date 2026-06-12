import { GoogleGenerativeAI } from "@google/generative-ai";

import {
  SHELF_ANALYSIS_PROMPT,
  SHELF_ANALYSIS_RESPONSE_SCHEMA,
} from "@/lib/gemini/shelf-analysis-schema";
import type {
  PriceTag,
  Shelf,
  ShelfAnalysisResult,
  ShelfItem,
  ShelfStatisticsSummary,
} from "@/lib/types/shelf-analysis";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your .env file.",
    );
  }

  return apiKey;
}

function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

function createGenerativeModel() {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());

  return genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: SHELF_ANALYSIS_RESPONSE_SCHEMA,
    },
  });
}

function normalizePriceTag(value: unknown): PriceTag {
  if (typeof value !== "object" || value === null) {
    return { detected: false, amount: null, currency: null };
  }

  const tag = value as Record<string, unknown>;

  return {
    detected: typeof tag.detected === "boolean" ? tag.detected : false,
    amount:
      typeof tag.amount === "number" && Number.isFinite(tag.amount)
        ? tag.amount
        : null,
    currency: typeof tag.currency === "string" ? tag.currency : null,
  };
}

function normalizeShelfItem(value: unknown): ShelfItem | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const item = value as Record<string, unknown>;
  const itemId = typeof item.item_id === "string" ? item.item_id.trim() : "";
  const brand = typeof item.brand === "string" ? item.brand.trim() : "";
  const productName =
    typeof item.product_name === "string" ? item.product_name.trim() : "";

  if (!itemId || !brand || !productName) {
    return null;
  }

  return {
    item_id: itemId,
    brand,
    product_name: productName,
    packaging_variant:
      typeof item.packaging_variant === "string"
        ? item.packaging_variant.trim()
        : "Standard",
    visible_facings:
      typeof item.visible_facings === "number" &&
      Number.isFinite(item.visible_facings)
        ? Math.max(0, Math.round(item.visible_facings))
        : 1,
    is_stacked: item.is_stacked === true,
    is_nested: item.is_nested === true,
    price_tag: normalizePriceTag(item.price_tag),
    visual_notes:
      typeof item.visual_notes === "string" ? item.visual_notes.trim() : "",
  };
}

function normalizeShelf(value: unknown): Shelf | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const shelf = value as Record<string, unknown>;
  const items = Array.isArray(shelf.items)
    ? shelf.items
        .map(normalizeShelfItem)
        .filter((item): item is ShelfItem => item !== null)
    : [];

  if (items.length === 0) {
    return null;
  }

  return {
    shelf_level:
      typeof shelf.shelf_level === "number" && Number.isFinite(shelf.shelf_level)
        ? Math.max(1, Math.round(shelf.shelf_level))
        : 1,
    position_description:
      typeof shelf.position_description === "string"
        ? shelf.position_description.trim()
        : "Shelf",
    zone_quality:
      typeof shelf.zone_quality === "string"
        ? shelf.zone_quality.trim()
        : "Unknown",
    items,
  };
}

function normalizePercentMap(value: unknown): Record<string, number> {
  if (Array.isArray(value)) {
    return value.reduce<Record<string, number>>((accumulator, entry) => {
      if (typeof entry !== "object" || entry === null) {
        return accumulator;
      }

      const item = entry as Record<string, unknown>;
      const brand = typeof item.brand === "string" ? item.brand.trim() : "";
      const percent =
        typeof item.percent === "number" && Number.isFinite(item.percent)
          ? item.percent
          : null;

      if (brand && percent !== null) {
        accumulator[brand] = percent;
      }

      return accumulator;
    }, {});
  }

  if (typeof value !== "object" || value === null) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, number>
  >((accumulator, [brand, percent]) => {
    if (typeof percent === "number" && Number.isFinite(percent)) {
      accumulator[brand] = percent;
    }

    return accumulator;
  }, {});
}

function normalizeStatisticsSummary(value: unknown): ShelfStatisticsSummary {
  if (typeof value !== "object" || value === null) {
    return {
      share_of_shelf_by_brand_percent: {},
      premium_placement_utilization_percent: {},
      overall_price_tag_compliance_percent: 0,
    };
  }

  const summary = value as Record<string, unknown>;
  const compliance =
    typeof summary.overall_price_tag_compliance_percent === "number" &&
    Number.isFinite(summary.overall_price_tag_compliance_percent)
      ? summary.overall_price_tag_compliance_percent
      : 0;

  return {
    share_of_shelf_by_brand_percent: normalizePercentMap(
      summary.share_of_shelf_by_brand_percent,
    ),
    premium_placement_utilization_percent: normalizePercentMap(
      summary.premium_placement_utilization_percent,
    ),
    overall_price_tag_compliance_percent: compliance,
  };
}

export function parseShelfAnalysisResponse(rawText: string): ShelfAnalysisResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Gemini returned invalid JSON for shelf analysis.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Gemini response did not match the expected analysis schema.");
  }

  const payload = parsed as Record<string, unknown>;
  const metadata =
    typeof payload.metadata === "object" && payload.metadata !== null
      ? (payload.metadata as Record<string, unknown>)
      : null;

  const shelves = Array.isArray(payload.shelves)
    ? payload.shelves
        .map(normalizeShelf)
        .filter((shelf): shelf is Shelf => shelf !== null)
    : [];

  if (!metadata || shelves.length === 0) {
    throw new Error("Gemini response did not include usable shelf analysis data.");
  }

  return {
    poc_project:
      typeof payload.poc_project === "string" ? payload.poc_project : undefined,
    target_client:
      typeof payload.target_client === "string"
        ? payload.target_client
        : undefined,
    source_image:
      typeof payload.source_image === "string"
        ? payload.source_image
        : undefined,
    metadata: {
      total_shelves_detected:
        typeof metadata.total_shelves_detected === "number"
          ? Math.max(0, Math.round(metadata.total_shelves_detected))
          : shelves.length,
      estimated_unique_items_with_variants:
        typeof metadata.estimated_unique_items_with_variants === "number"
          ? Math.max(0, Math.round(metadata.estimated_unique_items_with_variants))
          : shelves.reduce((total, shelf) => total + shelf.items.length, 0),
      confidence_score:
        typeof metadata.confidence_score === "number" &&
        Number.isFinite(metadata.confidence_score)
          ? Math.min(1, Math.max(0, metadata.confidence_score))
          : 0.5,
    },
    shelf_statistics_summary: normalizeStatisticsSummary(
      payload.shelf_statistics_summary,
    ),
    shelves,
  };
}

export async function analyzeShelfImage(
  imageBuffer: Buffer,
  mimeType: string,
  sourceFileName?: string,
): Promise<ShelfAnalysisResult> {
  const model = createGenerativeModel();
  const fileContext = sourceFileName
    ? `\nSource image filename: ${sourceFileName}`
    : "";

  const result = await model.generateContent([
    `${SHELF_ANALYSIS_PROMPT}${fileContext}`,
    {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType,
      },
    },
  ]);

  const responseText = result.response.text();

  if (!responseText) {
    throw new Error("Gemini returned an empty analysis response.");
  }

  const analysis = parseShelfAnalysisResponse(responseText);

  return {
    ...analysis,
    source_image: sourceFileName ?? analysis.source_image,
  };
}
