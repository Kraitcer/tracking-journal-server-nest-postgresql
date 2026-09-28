import path from 'node:path';
import fs from 'node:fs/promises';
import { appConfig } from '../config.js';

const UPLOADS_MARKER = '/uploads/';

export function sanitizeUserId(value: unknown): string {
  if (typeof value !== 'string') return 'anonymous';
  const trimmed = value.trim();
  if (!trimmed) return 'anonymous';
  // Keep folder names predictable and traversal-safe.
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function extractUploadsRelativePath(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null;

  const normalized = rawValue.replace(/\\/g, '/');
  const index = normalized.toLowerCase().indexOf(UPLOADS_MARKER);
  if (index === -1) return null;

  const relative = normalized
    .slice(index + UPLOADS_MARKER.length)
    .split('?')[0]
    .split('#')[0]
    .replace(/^\/+/, '');
  return relative || null;
}

function collectUploadPaths(value: unknown, collector: Set<string>): void {
  if (typeof value === 'string') {
    const relative = extractUploadsRelativePath(value);
    if (relative) collector.add(relative);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectUploadPaths(item, collector));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((nested) =>
      collectUploadPaths(nested, collector),
    );
  }
}

function resolveSafeUploadPath(relativePath: string): string | null {
  const root = appConfig.uploadsDir;
  const absolute = path.resolve(root, path.normalize(relativePath));
  const rootWithSeparator = root.endsWith(path.sep) ? root : root + path.sep;
  return absolute.startsWith(rootWithSeparator) ? absolute : null;
}

export async function deleteImagesReferencedBy(bodies: unknown[]) {
  const relativePaths = new Set<string>();
  bodies.forEach((body) => collectUploadPaths(body, relativePaths));

  await Promise.all(
    [...relativePaths].map(async (relativePath) => {
      const absolutePath = resolveSafeUploadPath(relativePath);
      if (!absolutePath) return;
      try {
        await fs.unlink(absolutePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
          console.error('Failed to delete image file:', absolutePath, error);
        }
      }
    }),
  );
}
