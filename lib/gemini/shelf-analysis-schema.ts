import { SchemaType, type Schema } from "@google/generative-ai";

const PRICE_TAG_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    detected: { type: SchemaType.BOOLEAN },
    amount: { type: SchemaType.NUMBER, nullable: true },
    currency: { type: SchemaType.STRING, nullable: true },
  },
  required: ["detected", "amount", "currency"],
};

const SHELF_ITEM_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    item_id: { type: SchemaType.STRING },
    brand: { type: SchemaType.STRING },
    product_name: { type: SchemaType.STRING },
    packaging_variant: { type: SchemaType.STRING },
    visible_facings: { type: SchemaType.NUMBER },
    is_stacked: { type: SchemaType.BOOLEAN },
    is_nested: { type: SchemaType.BOOLEAN },
    price_tag: PRICE_TAG_SCHEMA,
    visual_notes: { type: SchemaType.STRING },
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
  type: SchemaType.OBJECT,
  properties: {
    shelf_level: { type: SchemaType.NUMBER },
    position_description: { type: SchemaType.STRING },
    zone_quality: { type: SchemaType.STRING },
    items: {
      type: SchemaType.ARRAY,
      items: SHELF_ITEM_SCHEMA,
    },
  },
  required: ["shelf_level", "position_description", "zone_quality", "items"],
};

export const SHELF_ANALYSIS_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    poc_project: { type: SchemaType.STRING },
    target_client: { type: SchemaType.STRING },
    source_image: { type: SchemaType.STRING },
    metadata: {
      type: SchemaType.OBJECT,
      properties: {
        total_shelves_detected: { type: SchemaType.NUMBER },
        estimated_unique_items_with_variants: { type: SchemaType.NUMBER },
        confidence_score: { type: SchemaType.NUMBER },
      },
      required: [
        "total_shelves_detected",
        "estimated_unique_items_with_variants",
        "confidence_score",
      ],
    },
    shelf_statistics_summary: {
      type: SchemaType.OBJECT,
      properties: {
        share_of_shelf_by_brand_percent: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              brand: { type: SchemaType.STRING },
              percent: { type: SchemaType.NUMBER },
            },
            required: ["brand", "percent"],
          },
        },
        premium_placement_utilization_percent: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              brand: { type: SchemaType.STRING },
              percent: { type: SchemaType.NUMBER },
            },
            required: ["brand", "percent"],
          },
        },
        overall_price_tag_compliance_percent: { type: SchemaType.NUMBER },
      },
      required: [
        "share_of_shelf_by_brand_percent",
        "premium_placement_utilization_percent",
        "overall_price_tag_compliance_percent",
      ],
    },
    shelves: {
      type: SchemaType.ARRAY,
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
