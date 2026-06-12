import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  ShelfAnalysisRecord,
  ShelfAnalysisResult,
} from "@/lib/types/shelf-analysis";

type PersistShelfAnalysisInput = {
  imageUrl: string;
  imageData?: Buffer;
  imageMimeType?: string;
  analysis: ShelfAnalysisResult;
};

export function mapAnalysisToRecord(
  analysis: Prisma.ShelfAnalysisGetPayload<{
    include: {
      shelves: {
        include: {
          items: true;
        };
      };
    };
  }>,
): ShelfAnalysisRecord {
  return {
    id: analysis.id,
    imageUrl: analysis.imageUrl,
    sourceImage: analysis.sourceImage,
    pocProject: analysis.pocProject,
    targetClient: analysis.targetClient,
    confidenceScore: analysis.confidenceScore,
    totalShelvesDetected: analysis.totalShelvesDetected,
    estimatedUniqueItems: analysis.estimatedUniqueItems,
    shareOfShelfByBrand: analysis.shareOfShelfByBrand as Record<string, number>,
    premiumPlacementUtilization:
      analysis.premiumPlacementUtilization as Record<string, number>,
    overallPriceTagCompliance: analysis.overallPriceTagCompliance,
    uploadedAt: analysis.uploadedAt,
    shelves: analysis.shelves
      .slice()
      .sort((left, right) => left.shelfLevel - right.shelfLevel)
      .map((shelf) => ({
        id: shelf.id,
        shelfLevel: shelf.shelfLevel,
        positionDescription: shelf.positionDescription,
        zoneQuality: shelf.zoneQuality,
        items: shelf.items.map((item) => ({
          id: item.id,
          itemId: item.itemId,
          brand: item.brand,
          productName: item.productName,
          packagingVariant: item.packagingVariant,
          visibleFacings: item.visibleFacings,
          isStacked: item.isStacked,
          isNested: item.isNested,
          priceTagDetected: item.priceTagDetected,
          priceAmount: item.priceAmount,
          priceCurrency: item.priceCurrency,
          visualNotes: item.visualNotes,
        })),
      })),
  };
}

export function buildAnalysisCreateInput(
  input: PersistShelfAnalysisInput,
): Prisma.ShelfAnalysisCreateInput {
  const { analysis, imageUrl, imageData, imageMimeType } = input;

  return {
    imageUrl,
    imageData: imageData ? new Uint8Array(imageData) : undefined,
    imageMimeType: imageMimeType ?? null,
    sourceImage: analysis.source_image ?? null,
    pocProject: analysis.poc_project ?? null,
    targetClient: analysis.target_client ?? null,
    confidenceScore: analysis.metadata.confidence_score,
    totalShelvesDetected: analysis.metadata.total_shelves_detected,
    estimatedUniqueItems: analysis.metadata.estimated_unique_items_with_variants,
    shareOfShelfByBrand: analysis.shelf_statistics_summary.share_of_shelf_by_brand_percent,
    premiumPlacementUtilization:
      analysis.shelf_statistics_summary.premium_placement_utilization_percent,
    overallPriceTagCompliance:
      analysis.shelf_statistics_summary.overall_price_tag_compliance_percent,
    shelves: {
      create: analysis.shelves.map((shelf) => ({
        shelfLevel: shelf.shelf_level,
        positionDescription: shelf.position_description,
        zoneQuality: shelf.zone_quality,
        items: {
          create: shelf.items.map((item) => ({
            itemId: item.item_id,
            brand: item.brand,
            productName: item.product_name,
            packagingVariant: item.packaging_variant,
            visibleFacings: item.visible_facings,
            isStacked: item.is_stacked,
            isNested: item.is_nested,
            priceTagDetected: item.price_tag.detected,
            priceAmount: item.price_tag.amount,
            priceCurrency: item.price_tag.currency,
            visualNotes: item.visual_notes,
          })),
        },
      })),
    },
  };
}
