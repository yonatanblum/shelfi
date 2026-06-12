import Image from "next/image";

import type { ShelfAnalysisRecord } from "@/lib/types/shelf-analysis";
import { AnalysisMetricCards } from "@/components/dashboard/analysis-metric-cards";
import { BrandShareChart } from "@/components/dashboard/brand-share-chart";
import { PremiumPlacementChart } from "@/components/dashboard/premium-placement-chart";
import { ShelfBreakdown } from "@/components/dashboard/shelf-breakdown";
import { ShelfItemsTable } from "@/components/dashboard/shelf-items-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatConfidence,
  formatDateTime,
  formatPercent,
} from "@/lib/formatters";

type AnalysisDetailViewProps = {
  analysis: ShelfAnalysisRecord;
};

export function AnalysisDetailView({ analysis }: AnalysisDetailViewProps) {
  const brandSharePercent = Object.entries(analysis.shareOfShelfByBrand)
    .map(([brand, percent]) => ({ brand, percent }))
    .sort((left, right) => right.percent - left.percent);

  const premiumPlacementPercent = Object.entries(
    analysis.premiumPlacementUtilization,
  )
    .map(([brand, percent]) => ({ brand, percent }))
    .sort((left, right) => right.percent - left.percent);

  const metrics = {
    totalAnalyses: 1,
    latestConfidenceScore: analysis.confidenceScore,
    averagePriceTagCompliance: analysis.overallPriceTagCompliance,
    brandSharePercent,
    premiumPlacementPercent,
  };

  return (
    <div className="space-y-8">
      <Card className="brutal-card rounded-md ring-0">
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              {analysis.sourceImage ?? "Shelf Analysis"}
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {analysis.pocProject ?? "Retail Shelf Image Analysis"}
              {analysis.targetClient ? ` · ${analysis.targetClient}` : ""} ·{" "}
              {formatDateTime(analysis.uploadedAt)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="border-2 border-foreground bg-primary text-primary-foreground">
                {analysis.totalShelvesDetected} shelves
              </Badge>
              <Badge className="border-2 border-foreground bg-secondary text-secondary-foreground">
                {analysis.estimatedUniqueItems} unique items
              </Badge>
              <Badge className="border-2 border-foreground bg-success text-success-foreground">
                {formatConfidence(analysis.confidenceScore)} confidence
              </Badge>
              <Badge className="border-2 border-foreground bg-accent text-accent-foreground">
                {formatPercent(analysis.overallPriceTagCompliance, 0)} price tags
              </Badge>
            </div>
          </div>
          <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-md border-2 border-foreground lg:h-48">
            <Image
              src={analysis.imageUrl}
              alt={`Shelf image ${analysis.sourceImage ?? analysis.id}`}
              fill
              className="object-cover"
              sizes="320px"
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Full structured output from Gemini: metadata, brand statistics, shelf zones,
            SKU-level facings, price tag compliance, and visual notes.
          </p>
        </CardContent>
      </Card>

      <AnalysisMetricCards metrics={metrics} />

      <div className="grid gap-8 xl:grid-cols-2">
        <BrandShareChart data={brandSharePercent} />
        <PremiumPlacementChart data={premiumPlacementPercent} />
      </div>

      <ShelfBreakdown shelves={analysis.shelves} />
      <ShelfItemsTable analysis={analysis} />
    </div>
  );
}
