import type { DashboardAnalysisMetrics } from "@/lib/types/shelf-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatConfidence, formatPercent } from "@/lib/formatters";
import { BarChart3, Layers3, ShieldCheck, Sparkles } from "lucide-react";

type AnalysisMetricCardsProps = {
  metrics: DashboardAnalysisMetrics;
};

const METRIC_CONFIG = [
  {
    key: "totalAnalyses" as const,
    label: "Shelf Analyses",
    icon: Layers3,
    accent: "bg-primary text-primary-foreground",
    format: (value: number) => String(value),
    description: "Total shelf images analyzed and stored.",
  },
  {
    key: "latestConfidenceScore" as const,
    label: "Model Confidence",
    icon: Sparkles,
    accent: "bg-secondary text-secondary-foreground",
    format: formatConfidence,
    description: "Latest Gemini confidence score for shelf detection.",
  },
  {
    key: "averagePriceTagCompliance" as const,
    label: "Price Tag Compliance",
    icon: ShieldCheck,
    accent: "bg-success text-success-foreground",
    format: formatPercent,
    description: "Average price tag compliance across all analyses.",
  },
  {
    key: "brandShareCount" as const,
    label: "Brands Tracked",
    icon: BarChart3,
    accent: "bg-accent text-accent-foreground",
    format: (value: number) => String(value),
    description: "Distinct brands in the latest shelf share breakdown.",
  },
];

export function AnalysisMetricCards({ metrics }: AnalysisMetricCardsProps) {
  const values = {
    totalAnalyses: metrics.totalAnalyses,
    latestConfidenceScore: metrics.latestConfidenceScore,
    averagePriceTagCompliance: metrics.averagePriceTagCompliance,
    brandShareCount: metrics.brandSharePercent.length,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRIC_CONFIG.map((metric) => {
        const Icon = metric.icon;
        const value = values[metric.key];

        return (
          <Card
            key={metric.key}
            className="brutal-card rounded-md ring-0 transition-none"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <p className="mt-3 text-4xl font-bold tracking-tight">
                  {metric.format(value)}
                </p>
              </div>
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-md border-2 border-foreground brutal-shadow-sm",
                  metric.accent,
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
