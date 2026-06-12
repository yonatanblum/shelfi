"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { FileJson, ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { loadSampleShelfAnalysis } from "@/app/actions/load-sample";
import { ExtractionSummary } from "@/components/upload/extraction-summary";
import { UploadActivityList } from "@/components/upload/upload-activity-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useShelfUploadQueue } from "@/hooks/useShelfUploadQueue";
import type { ShelfAnalysisRecord } from "@/lib/types/shelf-analysis";
import { cn } from "@/lib/utils";

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [sampleAnalysis, setSampleAnalysis] = useState<ShelfAnalysisRecord | null>(null);
  const { jobs, activeCount, latestAnalysis, enqueueFiles, isBusy } =
    useShelfUploadQueue();
  const displayedAnalysis = latestAnalysis ?? sampleAnalysis;

  const handleLoadSample = useCallback(async () => {
    setIsLoadingSample(true);

    const result = await loadSampleShelfAnalysis();

    if (!result.success) {
      toast.error(result.error);
      setIsLoadingSample(false);
      return;
    }

    setSampleAnalysis(result.analysis);
    toast.success("Loaded sample shelf analysis into the dashboard.");
    setIsLoadingSample(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      if (event.dataTransfer.files.length > 0) {
        enqueueFiles(event.dataTransfer.files);
      }
    },
    [enqueueFiles],
  );

  return (
    <div className="space-y-8">
      <Card className="brutal-card rounded-md ring-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-lg font-bold">Upload Shelf Images</CardTitle>
          <Button
            type="button"
            variant="outline"
            className="brutal-border brutal-shadow-sm brutal-press"
            disabled={isLoadingSample}
            onClick={() => void handleLoadSample()}
          >
            <FileJson className="size-4" aria-hidden="true" />
            Load Sample Analysis
          </Button>
        </CardHeader>
        <CardContent>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            className={cn(
              "brutal-press flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors duration-200",
              isDragging
                ? "border-primary bg-primary/10 brutal-shadow"
                : "border-foreground bg-muted hover:bg-secondary/40",
            )}
          >
            <div className="mb-4 flex size-16 items-center justify-center rounded-md border-2 border-foreground bg-card brutal-shadow-sm">
              {isBusy ? (
                <LoaderCircle className="size-7 animate-spin text-primary" />
              ) : (
                <UploadCloud className="size-7" aria-hidden="true" />
              )}
            </div>
            <p className="text-lg font-bold">Drag and drop shelf photos here</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Upload multiple images at once. Up to 3 analyses run in parallel, each
              with live progress logs and a time remaining estimate.
            </p>
            {activeCount > 0 ? (
              <p className="mt-3 text-sm font-semibold text-primary">
                {activeCount} image{activeCount === 1 ? "" : "s"} in progress — you
                can add more while others analyze.
              </p>
            ) : null}
            <Button
              type="button"
              className="mt-6 brutal-border brutal-shadow-sm brutal-press"
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <ImagePlus className="size-4" aria-hidden="true" />
              Choose Images
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  enqueueFiles(event.target.files);
                  event.target.value = "";
                }
              }}
            />
          </div>

          <UploadActivityList jobs={jobs} />
        </CardContent>
      </Card>

      {displayedAnalysis ? (
        <div className="space-y-4">
          <ExtractionSummary analysis={displayedAnalysis} />
          <div className="flex justify-end">
            <Link
              href={ROUTES.analysisDetail(displayedAnalysis.id)}
              className={cn(
                buttonVariants(),
                "brutal-border brutal-shadow-sm brutal-press",
              )}
            >
              Open Full Analysis
            </Link>
          </div>
        </div>
      ) : (
        <ExtractionSummary analysis={null} />
      )}
    </div>
  );
}
