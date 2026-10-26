import path from 'node:path';
import { getDatabaseUrl } from './database-url.js';

// Env var names match server/config/custom-environment-variables.json so existing tokens stay valid.
export const appConfig = {
  port: Number(process.env.PORT ?? 5000),
  get databaseUrl() {
    return getDatabaseUrl();
  },
  databasePoolMax: Number(process.env.DATABASE_POOL_MAX ?? 10),
  jwtPrivateKey:
    process.env.trackingApp_jwtPrivateKey ??
    process.env.TRACKINGAPP_JWTPRIVATEKEY,
  googleClientId: process.env.trackingApp_googleClientId ?? '',
  corsOrigins: (
    process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  uploadsDir: path.resolve(
    process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads'),
  ),
};

export function getJwtSecret(): Uint8Array {
  const key = appConfig.jwtPrivateKey;
  if (!key) {
    throw new Error(
      'JWT secret is missing or empty: set trackingApp_jwtPrivateKey or TRACKINGAPP_JWTPRIVATEKEY',
    );
  }
  if (Buffer.byteLength(key, 'utf8') < 32) {
    throw new Error(
      'JWT secret (trackingApp_jwtPrivateKey or TRACKINGAPP_JWTPRIVATEKEY) must be at least 32 UTF-8 bytes',
    );
  }
  return new TextEncoder().encode(key);
}
