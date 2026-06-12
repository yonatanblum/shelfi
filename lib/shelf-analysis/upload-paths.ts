import path from "node:path";

export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const UPLOAD_KEY_PATTERN = /^shelf-\d+-[a-z0-9]+\.[a-z0-9]+$/i;

export function createUniqueUploadKey(originalName: string): string {
  const extension = path.extname(originalName) || ".jpg";
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);

  return `shelf-${timestamp}-${randomSuffix}${extension}`;
}

export function isValidUploadKey(uploadKey: string): boolean {
  return UPLOAD_KEY_PATTERN.test(uploadKey);
}

export function resolveUploadPath(uploadKey: string): string {
  const normalizedKey = path.basename(uploadKey);

  if (!isValidUploadKey(normalizedKey)) {
    throw new Error("Invalid upload reference.");
  }

  return path.join(UPLOADS_DIR, normalizedKey);
}

export function buildShelfImageApiUrl(uploadKey: string): string {
  return `/api/shelf-images/${path.basename(uploadKey)}`;
}

export function extractUploadKeyFromImageUrl(imageUrl: string): string | null {
  const apiPrefix = "/api/shelf-images/";
  if (imageUrl.startsWith(apiPrefix)) {
    const uploadKey = path.basename(imageUrl.slice(apiPrefix.length));
    return isValidUploadKey(uploadKey) ? uploadKey : null;
  }

  const uploadsPrefix = "/uploads/";
  if (imageUrl.startsWith(uploadsPrefix)) {
    const uploadKey = path.basename(imageUrl.slice(uploadsPrefix.length));
    return isValidUploadKey(uploadKey) ? uploadKey : null;
  }

  return null;
}
