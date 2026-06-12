import Link from "next/link";
import { notFound } from "next/navigation";

import { getShelfAnalysisById } from "@/app/actions/shelf-analysis";
import { AnalysisDetailView } from "@/components/analysis/analysis-detail-view";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AnalysisPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { id } = await params;
  const analysis = await getShelfAnalysisById(id);

  if (!analysis) {
    notFound();
  }

  return (
    <DashboardShell
      title="Shelf Analysis Detail"
      description="Full structured output from the AI shelf audit."
      actions={
        <Link
          href={ROUTES.dashboard}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "brutal-border brutal-shadow-sm",
          )}
        >
          Back to Dashboard
        </Link>
      }
    >
      <AnalysisDetailView analysis={analysis} />
    </DashboardShell>
  );
}
