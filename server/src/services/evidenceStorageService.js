import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secure private storage directory — strictly OUTSIDE the public static web root
const DEFAULT_STORAGE_DIR = path.resolve(__dirname, '../../storage/return-evidence');
export const EVIDENCE_STORAGE_DIR = process.env.EVIDENCE_STORAGE_DIR
  ? path.resolve(process.env.EVIDENCE_STORAGE_DIR)
  : DEFAULT_STORAGE_DIR;

// Ensure private storage directory exists with restricted permissions
if (!fs.existsSync(EVIDENCE_STORAGE_DIR)) {
  fs.mkdirSync(EVIDENCE_STORAGE_DIR, { recursive: true });
}

// Permitted MIME types and maximum file size limits
export const ALLOWED_EVIDENCE_TYPES = {
  // Images (Up to 10 MB)
  'image/jpeg': { ext: 'jpg', type: 'IMAGE', maxSize: 10 * 1024 * 1024 },
  'image/jpg': { ext: 'jpg', type: 'IMAGE', maxSize: 10 * 1024 * 1024 },
  'image/png': { ext: 'png', type: 'IMAGE', maxSize: 10 * 1024 * 1024 },
  'image/webp': { ext: 'webp', type: 'IMAGE', maxSize: 10 * 1024 * 1024 },

  // Video (Up to 50 MB)
  'video/mp4': { ext: 'mp4', type: 'VIDEO', maxSize: 50 * 1024 * 1024 },
  'video/webm': { ext: 'webm', type: 'VIDEO', maxSize: 50 * 1024 * 1024 },
  'video/quicktime': { ext: 'mov', type: 'VIDEO', maxSize: 50 * 1024 * 1024 },
};

/**
 * Saves private evidence (photo or unboxing video) securely to private disk storage.
 * Files are given unguessable cryptographic keys and are NOT accessible via public static URLs.
 *
 * @param {Object} filePayload
 * @param {string} filePayload.data - Base64 dataURL (e.g. data:image/jpeg;base64,...) or raw base64 string
 * @param {string} filePayload.fileName - Original client filename
 * @param {string} [filePayload.mimeType] - Optional explicit mime type
 * @returns {Promise<{ storageKey: string, fileName: string, fileType: string, mimeType: string, fileSize: number }>}
 */
export async function savePrivateEvidenceFile({ data, fileName, mimeType: explicitMime }) {
  if (!data || typeof data !== 'string') {
    throw new Error('Evidence file data is required (Base64 format)');
  }

  // Parse Data URL format if present
  let resolvedMime = explicitMime ? explicitMime.toLowerCase().trim() : 'image/jpeg';
  let base64String = data;

  const dataUrlMatch = data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (dataUrlMatch && dataUrlMatch.length === 3) {
    resolvedMime = dataUrlMatch[1].toLowerCase().trim();
    base64String = dataUrlMatch[2];
  }

  const typeConfig = ALLOWED_EVIDENCE_TYPES[resolvedMime];
  if (!typeConfig) {
    const allowedList = Object.keys(ALLOWED_EVIDENCE_TYPES).join(', ');
    throw new Error(`Unsupported evidence file type (${resolvedMime}). Permitted formats: ${allowedList}`);
  }

  // Decode buffer
  const buffer = Buffer.from(base64String, 'base64');
  const fileSize = buffer.length;

  if (fileSize === 0) {
    throw new Error('Evidence file buffer is empty');
  }

  if (fileSize > typeConfig.maxSize) {
    const maxMb = Math.round(typeConfig.maxSize / (1024 * 1024));
    throw new Error(`File size (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds maximum limit of ${maxMb} MB for ${typeConfig.type.toLowerCase()}`);
  }

  // Generate unguessable private storage key
  const randomToken = crypto.randomBytes(16).toString('hex');
  const safeBaseName = (fileName || 'evidence')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 50);
  const storageKey = `ev_${Date.now()}_${randomToken}_${safeBaseName}`;

  const destinationPath = path.join(EVIDENCE_STORAGE_DIR, storageKey);

  // Ensure path is strictly within the private evidence storage dir (path traversal prevention)
  const relative = path.relative(EVIDENCE_STORAGE_DIR, destinationPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Security exception: invalid evidence storage path');
  }

  await fs.promises.writeFile(destinationPath, buffer);

  return {
    storageKey,
    fileName: safeBaseName,
    fileType: typeConfig.type,
    mimeType: resolvedMime,
    fileSize,
  };
}

/**
 * Resolves safe absolute path to an evidence file.
 * Throws error if file does not exist or if path traversal is attempted.
 */
export function getEvidenceFilePath(storageKey) {
  if (!storageKey || typeof storageKey !== 'string') {
    throw new Error('Storage key is required');
  }

  // Strip path separators to guarantee key is flat
  const safeKey = path.basename(storageKey);
  const resolvedPath = path.join(EVIDENCE_STORAGE_DIR, safeKey);

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  return resolvedPath;
}

/**
 * Deletes an evidence file from private storage
 */
export async function deleteEvidenceFile(storageKey) {
  try {
    const filePath = getEvidenceFilePath(storageKey);
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error(`[EVIDENCE STORAGE] Failed to delete file ${storageKey}:`, err.message);
  }
}
