"use server";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { analyzeShelfImage } from "@/lib/gemini/analyze-shelf-image";
import { prisma } from "@/lib/prisma";
import {
  logAnalysisCompleted,
  logAnalysisFailed,
  logFileSaved,
  logPersistCompleted,
  logUploadStarted,
} from "@/lib/shelf-analysis/analysis-logger";
import {
  measureAsync,
  type ShelfAnalysisTiming,
} from "@/lib/shelf-analysis/analysis-timing";
import {
  buildAnalysisCreateInput,
  mapAnalysisToRecord,
} from "@/lib/shelf-analysis/persist-analysis";
import {
  buildShelfImageApiUrl,
  createUniqueUploadKey,
  resolveUploadPath,
  UPLOADS_DIR,
} from "@/lib/shelf-analysis/upload-paths";
import type {
  DashboardAnalysisMetrics,
  ShelfAnalysisRecord,
  ShelfAnalysisResult,
} from "@/lib/types/shelf-analysis";

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

export type SaveShelfImageResult =
  | {
      success: true;
      uploadKey: string;
      imageUrl: string;
      fileSizeBytes: number;
      writeFileMs: number;
      mimeType: string;
    }
  | { success: false; error: string };

export type AnalyzeSavedShelfImageResult =
  | { success: true; analysis: ShelfAnalysisRecord; timing: ShelfAnalysisTiming }
  | { success: false; error: string; timing?: ShelfAnalysisTiming };

export async function saveShelfImageForAnalysis(
  formData: FormData,
): Promise<SaveShelfImageResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "No image file was provided." };
  }

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Only image files are supported." };
  }

  const logContext = { fileName: file.name };

  try {
    await ensureUploadsDirectory();

    const uploadKey = createUniqueUploadKey(file.name);
    const filePath = resolveUploadPath(uploadKey);
    const buffer = Buffer.from(await file.arrayBuffer());

    logUploadStarted(logContext, buffer.byteLength, file.type);

    const { durationMs: writeFileMs } = await measureAsync(() =>
      writeFile(filePath, buffer),
    );

    logFileSaved(logContext, writeFileMs, uploadKey);

    return {
      success: true,
      uploadKey,
      imageUrl: buildShelfImageApiUrl(uploadKey),
      fileSizeBytes: buffer.byteLength,
      writeFileMs,
      mimeType: file.type,
    };
  } catch (error) {
    logAnalysisFailed(logContext, "save", error, 0);

    const message =
      error instanceof Error ? error.message : "Failed to save shelf image.";

    return { success: false, error: message };
  }
}

export async function analyzeAndPersistSavedShelfImage(
  uploadKey: string,
  originalFileName: string,
  mimeType: string,
): Promise<AnalyzeSavedShelfImageResult> {
  const logContext = { fileName: originalFileName, uploadKey };
  const startedAt = Date.now();

  try {
    const filePath = resolveUploadPath(uploadKey);
    const { result: buffer, durationMs: readFileMs } = await measureAsync(() =>
      readFile(filePath),
    );

    const extracted = await analyzeShelfImage(buffer, mimeType, originalFileName);

    if (extracted.analysis.shelves.length === 0) {
      return {
        success: false,
        error: "No shelf data was detected in this image.",
        timing: {
          writeFileMs: readFileMs,
          geminiMs: extracted.geminiMs,
          parseMs: extracted.parseMs,
          persistMs: 0,
          totalMs: Date.now() - startedAt,
          imageSizeBytes: extracted.imageSizeBytes,
          model: extracted.model,
          responseBytes: extracted.responseBytes,
          shelvesDetected: 0,
          itemsDetected: 0,
          promptTokenCount: extracted.tokenUsage?.promptTokenCount,
          outputTokenCount: extracted.tokenUsage
            ? extracted.tokenUsage.candidatesTokenCount +
              extracted.tokenUsage.thoughtsTokenCount
            : undefined,
          thoughtsTokenCount: extracted.tokenUsage?.thoughtsTokenCount,
          totalTokenCount: extracted.tokenUsage?.totalTokenCount,
          estimatedCostUsd: extracted.estimatedCostUsd,
        },
      };
    }

    const imageUrl = buildShelfImageApiUrl(path.basename(uploadKey));
    const { result: analysis, durationMs: persistMs } = await measureAsync(() =>
      persistAnalysis(imageUrl, extracted.analysis, buffer, mimeType),
    );

    logPersistCompleted(logContext, persistMs, analysis.id);

    const itemsDetected = extracted.analysis.shelves.reduce(
      (total, shelf) => total + shelf.items.length,
      0,
    );
    const outputTokenCount = extracted.tokenUsage
      ? extracted.tokenUsage.candidatesTokenCount +
        extracted.tokenUsage.thoughtsTokenCount
      : undefined;
    const timing: ShelfAnalysisTiming = {
      writeFileMs: readFileMs,
      geminiMs: extracted.geminiMs,
      parseMs: extracted.parseMs,
      persistMs,
      totalMs: Date.now() - startedAt,
      imageSizeBytes: extracted.imageSizeBytes,
      model: extracted.model,
      responseBytes: extracted.responseBytes,
      shelvesDetected: extracted.analysis.shelves.length,
      itemsDetected,
      promptTokenCount: extracted.tokenUsage?.promptTokenCount,
      outputTokenCount,
      thoughtsTokenCount: extracted.tokenUsage?.thoughtsTokenCount,
      totalTokenCount: extracted.tokenUsage?.totalTokenCount,
      estimatedCostUsd: extracted.estimatedCostUsd,
    };

    logAnalysisCompleted(logContext, timing, timing);

    revalidatePath("/");
    revalidatePath("/upload");
    revalidatePath(`/analysis/${analysis.id}`);

    return { success: true, analysis, timing };
  } catch (error) {
    logAnalysisFailed(logContext, "analyze", error, Date.now() - startedAt);

    const message =
      error instanceof Error ? error.message : "Failed to process shelf image.";

    return { success: false, error: message };
  }
}

export async function uploadShelfImage(
  formData: FormData,
): Promise<
  | { success: true; analysis: ShelfAnalysisRecord; timing: ShelfAnalysisTiming }
  | { success: false; error: string }
> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "No image file was provided." };
  }

  const saved = await saveShelfImageForAnalysis(formData);

  if (!saved.success) {
    return saved;
  }

  const analyzed = await analyzeAndPersistSavedShelfImage(
    saved.uploadKey,
    file.name,
    saved.mimeType,
  );

  if (!analyzed.success) {
    return analyzed;
  }

  return {
    success: true,
    analysis: analyzed.analysis,
    timing: {
      ...analyzed.timing,
      writeFileMs: saved.writeFileMs,
      totalMs: saved.writeFileMs + analyzed.timing.totalMs,
    },
  };
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
  imageData?: Buffer,
  imageMimeType?: string,
): Promise<ShelfAnalysisRecord> {
  const created = await prisma.shelfAnalysis.create({
    data: buildAnalysisCreateInput({ imageUrl, analysis, imageData, imageMimeType }),
    include: ANALYSIS_INCLUDE,
  });

  return mapAnalysisToRecord(created);
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
