import { Type, type Schema } from "@google/genai";

const PRICE_TAG_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    detected: { type: Type.BOOLEAN },
    amount: { type: Type.NUMBER, nullable: true },
    currency: { type: Type.STRING, nullable: true },
  },
  required: ["detected", "amount", "currency"],
};

const SHELF_ITEM_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    item_id: { type: Type.STRING },
    brand: { type: Type.STRING },
    product_name: { type: Type.STRING },
    packaging_variant: { type: Type.STRING },
    visible_facings: { type: Type.NUMBER },
    is_stacked: { type: Type.BOOLEAN },
    is_nested: { type: Type.BOOLEAN },
    price_tag: PRICE_TAG_SCHEMA,
    visual_notes: { type: Type.STRING },
  },
  required: [
    "item_id",
    "brand",
    "product_name",
    "packaging_variant",
    "visible_facings",
    "is_stacked",
    "is_nested",
    "price_tag",
    "visual_notes",
  ],
};

const SHELF_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    shelf_level: { type: Type.NUMBER },
    position_description: { type: Type.STRING },
    zone_quality: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: SHELF_ITEM_SCHEMA,
    },
  },
  required: ["shelf_level", "position_description", "zone_quality", "items"],
};

export const SHELF_ANALYSIS_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    poc_project: { type: Type.STRING },
    target_client: { type: Type.STRING },
    source_image: { type: Type.STRING },
    metadata: {
      type: Type.OBJECT,
      properties: {
        total_shelves_detected: { type: Type.NUMBER },
        estimated_unique_items_with_variants: { type: Type.NUMBER },
        confidence_score: { type: Type.NUMBER },
      },
      required: [
        "total_shelves_detected",
        "estimated_unique_items_with_variants",
        "confidence_score",
      ],
    },
    shelf_statistics_summary: {
      type: Type.OBJECT,
      properties: {
        share_of_shelf_by_brand_percent: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brand: { type: Type.STRING },
              percent: { type: Type.NUMBER },
            },
            required: ["brand", "percent"],
          },
        },
        premium_placement_utilization_percent: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brand: { type: Type.STRING },
              percent: { type: Type.NUMBER },
            },
            required: ["brand", "percent"],
          },
        },
        overall_price_tag_compliance_percent: { type: Type.NUMBER },
      },
      required: [
        "share_of_shelf_by_brand_percent",
        "premium_placement_utilization_percent",
        "overall_price_tag_compliance_percent",
      ],
    },
    shelves: {
      type: Type.ARRAY,
      items: SHELF_SCHEMA,
    },
  },
  required: ["metadata", "shelf_statistics_summary", "shelves"],
};

export const SHELF_ANALYSIS_PROMPT = `Analyze this retail shelf image for a planogram and shelf compliance audit.

Return structured JSON describing every visible shelf level from top to bottom. For each shelf include zone quality (e.g. Premium - Eye Level, Low - Cluttered).

For each distinct product or packaging variant on the shelf return:
- item_id (generate SKU-style IDs like SKU-BRAND-001)
- brand
- product_name
- packaging_variant (describe visible packaging differences)
- visible_facings (count of front-facing units)
- is_stacked, is_nested
- price_tag (detected, amount if readable, currency if known)
- visual_notes (arrangement, compliance, clutter, cut-off items)

Compute metadata:
- total_shelves_detected
- estimated_unique_items_with_variants
- confidence_score (0-1)

Compute shelf_statistics_summary:
- share_of_shelf_by_brand_percent as an array of { brand, percent }
- premium_placement_utilization_percent as an array of { brand, percent }
- overall_price_tag_compliance_percent

Include poc_project "Retail Shelf Image Analysis" and infer target_client when possible.
Use source_image filename context if provided in the prompt text.`;
