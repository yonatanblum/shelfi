import Link from "next/link";

import {
  getDashboardMetrics,
  getLatestShelfAnalysis,
  getShelfAnalyses,
} from "@/app/actions/shelf-analysis";
import { AnalysisMetricCards } from "@/components/dashboard/analysis-metric-cards";
import { AnalysesList } from "@/components/dashboard/analyses-list";
import { BrandShareChart } from "@/components/dashboard/brand-share-chart";
import { PremiumPlacementChart } from "@/components/dashboard/premium-placement-chart";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { formatConfidence, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, analyses, latestAnalysis] = await Promise.all([
    getDashboardMetrics(),
    getShelfAnalyses(),
    getLatestShelfAnalysis(),
  ]);

  return (
    <DashboardShell
      title="Shelf Intelligence Dashboard"
      description="Monitor retail shelf audits, brand share, premium placement, and SKU-level compliance."
    >
      <div className="space-y-8">
        <AnalysisMetricCards metrics={metrics} />

        {latestAnalysis ? (
          <Card className="brutal-card rounded-md ring-0">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">Latest Analysis Snapshot</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  {latestAnalysis.sourceImage ?? "Most recent upload"} ·{" "}
                  {latestAnalysis.totalShelvesDetected} shelves ·{" "}
                  {formatConfidence(latestAnalysis.confidenceScore)} confidence ·{" "}
                  {formatPercent(latestAnalysis.overallPriceTagCompliance, 0)} price tags
                </p>
              </div>
              <Link
                href={ROUTES.analysisDetail(latestAnalysis.id)}
                className={cn(
                  buttonVariants(),
                  "brutal-border brutal-shadow-sm brutal-press",
                )}
              >
                View Full Analysis
              </Link>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {latestAnalysis.estimatedUniqueItems} unique items across{" "}
                {latestAnalysis.shelves.length} shelf levels with structured SKU metadata,
                facings, stacking flags, and visual compliance notes.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-2">
          <BrandShareChart data={metrics.brandSharePercent} />
          <PremiumPlacementChart data={metrics.premiumPlacementPercent} />
        </div>

        <AnalysesList analyses={analyses} />
      </div>
    </DashboardShell>
  );
}
