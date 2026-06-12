"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseShelfAnalysisResponse } from "@/lib/gemini/analyze-shelf-image";
import type { ShelfAnalysisRecord } from "@/lib/types/shelf-analysis";
import { importShelfAnalysis } from "@/app/actions/shelf-analysis";

export async function loadSampleShelfAnalysis(): Promise<
  { success: true; analysis: ShelfAnalysisRecord } | { success: false; error: string }
> {
  try {
    const fixturePath = path.join(
      process.cwd(),
      "lib",
      "fixtures",
      "sample-shelf-analysis.json",
    );
    const rawFixture = await readFile(fixturePath, "utf8");
    const parsedAnalysis = parseShelfAnalysisResponse(rawFixture);

    return importShelfAnalysis(parsedAnalysis, "/uploads/sample-shelf-placeholder.svg");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load sample analysis.";

    return { success: false, error: message };
  }
}
