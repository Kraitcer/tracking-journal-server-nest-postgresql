import path from 'node:path';

// Env var names match server/config/custom-environment-variables.json so existing tokens stay valid.
export const appConfig = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtPrivateKey: process.env.trackingApp_jwtPrivateKey,
  googleClientId: process.env.trackingApp_googleClientId ?? '',
  uploadsDir: path.resolve(
    process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads'),
  ),
};

export function getJwtSecret(): Uint8Array {
  const key = appConfig.jwtPrivateKey;
  if (!key || Buffer.byteLength(key, 'utf8') < 32) {
    throw new Error('trackingApp_jwtPrivateKey must be at least 32 bytes');
  }
  return new TextEncoder().encode(key);
}
