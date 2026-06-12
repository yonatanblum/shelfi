import type { ShelfAnalysisRecord } from "@/lib/types/shelf-analysis";
import { ShelfBreakdown } from "@/components/dashboard/shelf-breakdown";
import { ShelfItemsTable } from "@/components/dashboard/shelf-items-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatConfidence, formatPercent } from "@/lib/formatters";

type ExtractionSummaryProps = {
  analysis: ShelfAnalysisRecord | null;
};

export function ExtractionSummary({ analysis }: ExtractionSummaryProps) {
  if (!analysis) {
    return (
      <Card className="brutal-card rounded-md ring-0">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Latest Extraction</CardTitle>
          <CardDescription>
            Upload a shelf image or load the sample JSON to preview structured AI output.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border-2 border-dashed border-foreground bg-muted px-6 py-10 text-center text-sm text-muted-foreground">
            No analysis yet. The dashboard will populate with metadata, brand share,
            premium placement, and shelf-by-shelf SKU details.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="brutal-card rounded-md ring-0">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Latest Extraction</CardTitle>
          <CardDescription>
            {analysis.sourceImage ?? "Shelf analysis"} ·{" "}
            {formatConfidence(analysis.confidenceScore)} confidence ·{" "}
            {formatPercent(analysis.overallPriceTagCompliance, 0)} price tag compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Detected {analysis.totalShelvesDetected} shelves and{" "}
            {analysis.estimatedUniqueItems} unique items with variants.
          </p>
        </CardContent>
      </Card>

      <ShelfBreakdown shelves={analysis.shelves} />
      <ShelfItemsTable analysis={analysis} />
    </div>
  );
}
