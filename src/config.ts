import path from 'node:path';

// Env var names match server/config/custom-environment-variables.json so existing tokens stay valid.
export const appConfig = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtPrivateKey:
    process.env.trackingApp_jwtPrivateKey ?? 'dev_jwt_secret_change_me',
  googleClientId: process.env.trackingApp_googleClientId ?? '',
  uploadsDir: path.resolve(
    process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads'),
  ),
};

export function getJwtSecret(): Uint8Array {
  const key = appConfig.jwtPrivateKey;
  if (!key || !key.trim()) {
    throw new Error('jwtPrivateKey is not configured');
  }
  return new TextEncoder().encode(key);
}
