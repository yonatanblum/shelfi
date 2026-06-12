import { readFile } from "node:fs/promises";

import { prisma } from "@/lib/prisma";
import {
  isValidUploadKey,
  resolveUploadPath,
} from "@/lib/shelf-analysis/upload-paths";

type RouteContext = {
  params: Promise<{ uploadKey: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { uploadKey: rawUploadKey } = await context.params;
  const uploadKey = rawUploadKey.split("/").pop() ?? rawUploadKey;

  if (!isValidUploadKey(uploadKey)) {
    return new Response("Not found", { status: 404 });
  }

  const imageUrl = `/api/shelf-images/${uploadKey}`;
  const legacyImageUrl = `/uploads/${uploadKey}`;

  const analysis = await prisma.shelfAnalysis.findFirst({
    where: {
      OR: [{ imageUrl }, { imageUrl: legacyImageUrl }],
    },
    select: {
      imageData: true,
      imageMimeType: true,
    },
  });

  if (analysis?.imageData) {
    const body = Buffer.from(analysis.imageData);

    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(body.byteLength),
        "Content-Type": analysis.imageMimeType ?? "application/octet-stream",
      },
    });
  }

  try {
    const filePath = resolveUploadPath(uploadKey);
    const fileBuffer = await readFile(filePath);
    const mimeType = guessMimeType(uploadKey);

    return new Response(fileBuffer, {
      headers: {
        "Cache-Control": "private, max-age=60",
        "Content-Length": String(fileBuffer.byteLength),
        "Content-Type": mimeType,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function guessMimeType(uploadKey: string): string {
  const extension = uploadKey.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
