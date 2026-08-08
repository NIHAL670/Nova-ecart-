/**
 * Image upload pipeline.
 *
 *  - Multer writes to an in-memory buffer (no temp files on disk)
 *  - If Cloudinary is configured: stream the buffer to Cloudinary, return CDN url
 *  - Otherwise: persist to `src/uploads/<file>` and serve statically
 *
 * Limits: images only, max 5MB per file, max 8 files per request.
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { ApiError } from './ApiError';

const UPLOAD_DIR = path.resolve(__dirname, '../uploads');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(ApiError.badRequest(`File type not allowed: ${file.mimetype}`));
  },
});

interface StoredImage {
  url: string;
  publicId?: string;
}

/** Upload a single in-memory file buffer. Returns { url, publicId? }. */
export async function storeImage(file: Express.Multer.File): Promise<StoredImage> {
  const name = `${randomUUID()}${path.extname(file.originalname) || '.jpg'}`;

  if (isCloudinaryConfigured) {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'novacart', public_id: name.replace(/\.[^.]+$/, ''), resource_type: 'image' },
        (error, result) => (error ? reject(error) : resolve(result as { secure_url: string; public_id: string })),
      );
      stream.end(file.buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  // Local fallback for dev environments.
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return { url: `/uploads/${name}` };
}

/** Delete a previously uploaded image (best-effort). */
export async function deleteImage(publicId?: string, url?: string): Promise<void> {
  if (publicId && isCloudinaryConfigured) {
    await cloudinary.uploader.destroy(publicId).catch(() => undefined);
    return;
  }
  if (url?.startsWith('/uploads/')) {
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => undefined);
  }
}

/** Extract uploaded files from a request (supports single + multiple + cloudinary buffer). */
export function getUploadedFiles(req: Request): Express.Multer.File[] {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  return files;
}

export { UPLOAD_DIR };
