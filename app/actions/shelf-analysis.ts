"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { analyzeShelfImage } from "@/lib/gemini/analyze-shelf-image";
import { prisma } from "@/lib/prisma";
import {
  buildAnalysisCreateInput,
  mapAnalysisToRecord,
} from "@/lib/shelf-analysis/persist-analysis";
import type {
  DashboardAnalysisMetrics,
  ShelfAnalysisRecord,
  ShelfAnalysisResult,
} from "@/lib/types/shelf-analysis";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const ANALYSIS_INCLUDE = {
  shelves: {
    include: {
      items: true,
    },
  },
} as const;

async function ensureUploadsDirectory(): Promise<void> {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

function createUniqueFilename(originalName: string): string {
  const extension = path.extname(originalName) || ".jpg";
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);

  return `shelf-${timestamp}-${randomSuffix}${extension}`;
}

function percentMapToSortedArray(
  values: Record<string, number>,
): Array<{ brand: string; percent: number }> {
  return Object.entries(values)
    .map(([brand, percent]) => ({ brand, percent }))
    .sort((left, right) => right.percent - left.percent);
}

async function persistAnalysis(
  imageUrl: string,
  analysis: ShelfAnalysisResult,
): Promise<ShelfAnalysisRecord> {
  const created = await prisma.shelfAnalysis.create({
    data: buildAnalysisCreateInput({ imageUrl, analysis }),
    include: ANALYSIS_INCLUDE,
  });

  return mapAnalysisToRecord(created);
}

export async function uploadShelfImage(
  formData: FormData,
): Promise<
  { success: true; analysis: ShelfAnalysisRecord } | { success: false; error: string }
> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "No image file was provided." };
  }

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Only image files are supported." };
  }

  try {
    await ensureUploadsDirectory();

    const filename = createUniqueFilename(file.name);
    const filePath = path.join(UPLOADS_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, buffer);

    const extractedAnalysis = await analyzeShelfImage(
      buffer,
      file.type,
      file.name,
    );

    if (extractedAnalysis.shelves.length === 0) {
      return {
        success: false,
        error: "No shelf data was detected in this image.",
      };
    }

    const imageUrl = `/uploads/${filename}`;
    const analysis = await persistAnalysis(imageUrl, extractedAnalysis);

    revalidatePath("/");
    revalidatePath("/upload");
    revalidatePath(`/analysis/${analysis.id}`);

    return { success: true, analysis };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process shelf image.";

    return { success: false, error: message };
  }
}

export async function importShelfAnalysis(
  analysis: ShelfAnalysisResult,
  imageUrl = "/uploads/sample-placeholder.jpg",
): Promise<
  { success: true; analysis: ShelfAnalysisRecord } | { success: false; error: string }
> {
  try {
    if (analysis.shelves.length === 0) {
      return { success: false, error: "Analysis must include at least one shelf." };
    }

    const record = await persistAnalysis(imageUrl, analysis);

    revalidatePath("/");
    revalidatePath("/upload");
    revalidatePath(`/analysis/${record.id}`);

    return { success: true, analysis: record };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import shelf analysis.";

    return { success: false, error: message };
  }
}

export async function getShelfAnalyses(): Promise<ShelfAnalysisRecord[]> {
  const analyses = await prisma.shelfAnalysis.findMany({
    include: ANALYSIS_INCLUDE,
    orderBy: { uploadedAt: "desc" },
  });

  return analyses.map(mapAnalysisToRecord);
}

export async function getShelfAnalysisById(
  id: string,
): Promise<ShelfAnalysisRecord | null> {
  const analysis = await prisma.shelfAnalysis.findUnique({
    where: { id },
    include: ANALYSIS_INCLUDE,
  });

  return analysis ? mapAnalysisToRecord(analysis) : null;
}

export async function getLatestShelfAnalysis(): Promise<ShelfAnalysisRecord | null> {
  const analysis = await prisma.shelfAnalysis.findFirst({
    include: ANALYSIS_INCLUDE,
    orderBy: { uploadedAt: "desc" },
  });

  return analysis ? mapAnalysisToRecord(analysis) : null;
}

export async function getDashboardMetrics(): Promise<DashboardAnalysisMetrics> {
  const analyses = await prisma.shelfAnalysis.findMany({
    select: {
      confidenceScore: true,
      overallPriceTagCompliance: true,
      shareOfShelfByBrand: true,
      premiumPlacementUtilization: true,
    },
    orderBy: { uploadedAt: "desc" },
  });

  if (analyses.length === 0) {
    return {
      totalAnalyses: 0,
      latestConfidenceScore: 0,
      averagePriceTagCompliance: 0,
      brandSharePercent: [],
      premiumPlacementPercent: [],
    };
  }

  const latest = analyses[0];
  const averagePriceTagCompliance =
    analyses.reduce((total, analysis) => total + analysis.overallPriceTagCompliance, 0) /
    analyses.length;

  return {
    totalAnalyses: analyses.length,
    latestConfidenceScore: latest.confidenceScore,
    averagePriceTagCompliance: Math.round(averagePriceTagCompliance),
    brandSharePercent: percentMapToSortedArray(
      latest.shareOfShelfByBrand as Record<string, number>,
    ),
    premiumPlacementPercent: percentMapToSortedArray(
      latest.premiumPlacementUtilization as Record<string, number>,
    ),
  };
}
