import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../public/uploads');
const rootUploadsDir = path.resolve(__dirname, '../../../public/uploads');

// Ensure upload directories exist
for (const dir of [uploadsDir, rootUploadsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Uploads an image from base64 dataURL or raw buffer
 * Returns a permanent, statically served public URL (/uploads/filename.ext)
 */
export async function uploadImage(req, res) {
  try {
    const { data, filename } = req.body;

    if (!data || typeof data !== 'string') {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Base64 image data string is required in "data" field',
      });
    }

    // Match data URL prefix: data:image/png;base64,....
    const matches = data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let base64Data = data;

    if (matches && matches.length === 3) {
      mimeType = matches[1].toLowerCase();
      base64Data = matches[2];
    }

    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return res.status(400).json({
        error: 'UNSUPPORTED_TYPE',
        message: `Unsupported image format (${mimeType}). Allowed: JPEG, PNG, WEBP, SVG, GIF`,
      });
    }

    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        error: 'FILE_TOO_LARGE',
        message: `Image exceeds maximum allowed size of 5 MB (actual: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`,
      });
    }

    const ext = ALLOWED_MIME_TYPES[mimeType];
    const uniqueId = crypto.randomUUID();
    const safeFilename = `${uniqueId}.${ext}`;
    const filePath = path.join(uploadsDir, safeFilename);
    const rootFilePath = path.join(rootUploadsDir, safeFilename);

    await Promise.all([
      fs.promises.writeFile(filePath, buffer),
      fs.promises.writeFile(rootFilePath, buffer),
    ]);

    const publicUrl = `/uploads/${safeFilename}`;

    return res.status(201).json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
      sizeBytes: buffer.length,
      mimeType,
      message: 'Image uploaded successfully',
    });
  } catch (err) {
    console.error('[ADMIN UPLOAD ERROR]:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process and store image',
    });
  }
}
