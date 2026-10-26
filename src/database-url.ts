export function getDatabaseUrl(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  if (environment.DATABASE_URL?.trim()) {
    return environment.DATABASE_URL;
  }

  const required = (name: string): string => {
    const value = environment[name];
    if (value === undefined || value === '') {
      throw new Error(`${name} must be configured when DATABASE_URL is not set`);
    }
    return value;
  };

  const user = required('DB_USER');
  const password = required('DB_PASSWORD');
  const host = required('DB_HOST');
  const database = required('DB_NAME');
  const port = environment.DB_PORT ?? '5432';
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }
  if (
    !host.trim() ||
    /[\s/@?#\\]/.test(host) ||
    (host.includes(':') && !/^\[[0-9a-fA-F:]+\]$/.test(host))
  ) {
    throw new Error('DB_HOST must be a hostname, IPv4 or bracketed IPv6 address');
  }

  const schema = environment.DB_SCHEMA ?? 'public';
  if (!schema.trim()) {
    throw new Error('DB_SCHEMA must not be empty');
  }
  return (
    `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}` +
    `@${host}:${port}/${encodeURIComponent(database)}` +
    `?schema=${encodeURIComponent(schema)}`
  );
}
