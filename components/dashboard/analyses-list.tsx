import Link from "next/link";

import type { ShelfAnalysisRecord } from "@/lib/types/shelf-analysis";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatConfidence, formatDateTime, formatPercent } from "@/lib/formatters";
import { ROUTES } from "@/constants/routes";

type AnalysesListProps = {
  analyses: ShelfAnalysisRecord[];
};

export function AnalysesList({ analyses }: AnalysesListProps) {
  return (
    <Card className="brutal-card rounded-md ring-0">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Recent Analyses</CardTitle>
        <CardDescription>
          Browse full shelf breakdowns for each uploaded image.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {analyses.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-foreground bg-muted px-6 py-10 text-center text-sm text-muted-foreground">
            No analyses yet. Upload a shelf image or load the sample analysis.
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <Link
                key={analysis.id}
                href={ROUTES.analysisDetail(analysis.id)}
                className="brutal-press block rounded-md border-2 border-foreground bg-card px-4 py-4 brutal-shadow-sm transition-colors hover:bg-secondary/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {analysis.sourceImage ?? "Shelf analysis"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {analysis.targetClient ?? analysis.pocProject ?? "Retail audit"} ·{" "}
                      {formatDateTime(analysis.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-2 border-foreground bg-primary text-primary-foreground">
                      {analysis.totalShelvesDetected} shelves
                    </Badge>
                    <Badge className="border-2 border-foreground bg-secondary text-secondary-foreground">
                      {analysis.estimatedUniqueItems} SKUs
                    </Badge>
                    <Badge className="border-2 border-foreground bg-success text-success-foreground">
                      {formatConfidence(analysis.confidenceScore)} confidence
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Price tag compliance:{" "}
                  {formatPercent(analysis.overallPriceTagCompliance, 0)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
