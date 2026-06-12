export type PriceTag = {
  detected: boolean;
  amount: number | null;
  currency: string | null;
};

export type ShelfItem = {
  item_id: string;
  brand: string;
  product_name: string;
  packaging_variant: string;
  visible_facings: number;
  is_stacked: boolean;
  is_nested: boolean;
  price_tag: PriceTag;
  visual_notes: string;
};

export type Shelf = {
  shelf_level: number;
  position_description: string;
  zone_quality: string;
  items: ShelfItem[];
};

export type ShelfAnalysisMetadata = {
  total_shelves_detected: number;
  estimated_unique_items_with_variants: number;
  confidence_score: number;
};

export type ShelfStatisticsSummary = {
  share_of_shelf_by_brand_percent: Record<string, number>;
  premium_placement_utilization_percent: Record<string, number>;
  overall_price_tag_compliance_percent: number;
};

export type ShelfAnalysisResult = {
  poc_project?: string;
  target_client?: string;
  source_image?: string;
  metadata: ShelfAnalysisMetadata;
  shelf_statistics_summary: ShelfStatisticsSummary;
  shelves: Shelf[];
};

export type ShelfAnalysisRecord = {
  id: string;
  imageUrl: string;
  sourceImage: string | null;
  pocProject: string | null;
  targetClient: string | null;
  confidenceScore: number;
  totalShelvesDetected: number;
  estimatedUniqueItems: number;
  shareOfShelfByBrand: Record<string, number>;
  premiumPlacementUtilization: Record<string, number>;
  overallPriceTagCompliance: number;
  uploadedAt: Date;
  shelves: ShelfRecord[];
};

export type ShelfRecord = {
  id: string;
  shelfLevel: number;
  positionDescription: string;
  zoneQuality: string;
  items: ShelfItemRecord[];
};

export type ShelfItemRecord = {
  id: string;
  itemId: string;
  brand: string;
  productName: string;
  packagingVariant: string;
  visibleFacings: number;
  isStacked: boolean;
  isNested: boolean;
  priceTagDetected: boolean;
  priceAmount: number | null;
  priceCurrency: string | null;
  visualNotes: string;
};

export type DashboardAnalysisMetrics = {
  totalAnalyses: number;
  latestConfidenceScore: number;
  averagePriceTagCompliance: number;
  brandSharePercent: Array<{ brand: string; percent: number }>;
  premiumPlacementPercent: Array<{ brand: string; percent: number }>;
};
