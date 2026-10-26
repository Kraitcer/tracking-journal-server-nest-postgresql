import { getDatabaseUrl } from './database-url.js';
import { appConfig } from './config.js';

const databaseEnvironment = {
  DB_USER: 'journal',
  DB_PASSWORD: 'example-password',
  DB_HOST: 'postgres.internal',
  DB_NAME: 'journal',
};

describe('getDatabaseUrl', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('preserves an explicit DATABASE_URL, including connection options', () => {
    const url = 'postgresql://user:password@host/db?sslmode=require';
    expect(getDatabaseUrl({ DATABASE_URL: url })).toBe(url);
  });

  it('builds a connection string with default port and schema', () => {
    expect(getDatabaseUrl(databaseEnvironment)).toBe(
      'postgresql://journal:example-password@postgres.internal:5432/journal?schema=public',
    );
  });

  it('uses separate variables when DATABASE_URL is blank', () => {
    expect(
      getDatabaseUrl({ ...databaseEnvironment, DATABASE_URL: '  ' }),
    ).toBe(getDatabaseUrl(databaseEnvironment));
  });

  it('encodes credentials, database and schema without corrupting their values', () => {
    const url = new URL(
      getDatabaseUrl({
        ...databaseEnvironment,
        DB_USER: 'user@team',
        DB_PASSWORD: 'p@ss:/?#% word',
        DB_NAME: 'journal/name',
        DB_SCHEMA: 'custom schema',
        DB_PORT: '5433',
      }),
    );
    expect(decodeURIComponent(url.username)).toBe('user@team');
    expect(decodeURIComponent(url.password)).toBe('p@ss:/?#% word');
    expect(decodeURIComponent(url.pathname.slice(1))).toBe('journal/name');
    expect(url.searchParams.get('schema')).toBe('custom schema');
    expect(url.port).toBe('5433');
  });

  it('supports bracketed IPv6 hosts', () => {
    expect(
      new URL(getDatabaseUrl({ ...databaseEnvironment, DB_HOST: '[::1]' }))
        .hostname,
    ).toBe('[::1]');
  });

  it.each(['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME'])(
    'reports a missing %s without exposing credentials',
    (name) => {
      const environment: NodeJS.ProcessEnv = { ...databaseEnvironment };
      delete environment[name];
      expect(() => getDatabaseUrl(environment)).toThrow(
        `${name} must be configured when DATABASE_URL is not set`,
      );
    },
  );

  it.each(['', '0', '65536', '5432/path', 'not-a-port'])(
    'rejects invalid port %j',
    (port) => {
      expect(() =>
        getDatabaseUrl({ ...databaseEnvironment, DB_PORT: port }),
      ).toThrow('DB_PORT must be an integer between 1 and 65535');
    },
  );

  it.each(['', 'host/path', 'user@host', 'host:5432', 'host?option=1'])(
    'rejects invalid host %j',
    (host) => {
      expect(() =>
        getDatabaseUrl({ ...databaseEnvironment, DB_HOST: host }),
      ).toThrow(/DB_HOST/);
    },
  );

  it('rejects an empty schema', () => {
    expect(() =>
      getDatabaseUrl({ ...databaseEnvironment, DB_SCHEMA: '' }),
    ).toThrow('DB_SCHEMA must not be empty');
  });

  it('uses the same resolver in application configuration', () => {
    vi.stubEnv('DATABASE_URL', '');
    for (const [name, value] of Object.entries(databaseEnvironment)) {
      vi.stubEnv(name, value);
    }
    vi.stubEnv('DB_PORT', '5432');
    vi.stubEnv('DB_SCHEMA', 'public');
    expect(appConfig.databaseUrl).toBe(getDatabaseUrl(databaseEnvironment));
  });
});
