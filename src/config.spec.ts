describe('JWT secret configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    // Match Linux case-sensitive environment names when running tests on Windows.
    vi.stubGlobal('process', { ...process, env: { ...process.env } });
    vi.stubEnv('trackingApp_jwtPrivateKey', undefined);
    vi.stubEnv('TRACKINGAPP_JWTPRIVATEKEY', undefined);
  });

  describe('Google client configuration', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it('reads the public client ID from GOOGLE_CLIENT_ID', async () => {
      vi.resetModules();
      vi.stubEnv('GOOGLE_CLIENT_ID', '  test.apps.googleusercontent.com  ');
      vi.stubEnv('trackingApp_googleClientId', 'legacy.apps.googleusercontent.com');
      const { appConfig } = await import('./config.js');
      expect(appConfig.googleClientId).toBe('test.apps.googleusercontent.com');
    });

    it.each([undefined, '', '   '])(
      'leaves Google login unconfigured for %s without using the legacy variable',
      async (value) => {
        vi.resetModules();
        vi.stubEnv('GOOGLE_CLIENT_ID', value);
        vi.stubEnv('trackingApp_googleClientId', 'legacy.apps.googleusercontent.com');
        const { appConfig } = await import('./config.js');
        expect(appConfig.googleClientId).toBe('');
      },
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it.each(['trackingApp_jwtPrivateKey', 'TRACKINGAPP_JWTPRIVATEKEY'])(
    'accepts a 32-byte secret from %s',
    async (name) => {
      const key = 'x'.repeat(32);
      vi.stubEnv(name, key);
      const { getJwtSecret } = await import('./config.js');
      expect(getJwtSecret()).toEqual(new TextEncoder().encode(key));
    },
  );

  it('preserves the legacy name priority when both names are present', async () => {
    const key = 'l'.repeat(32);
    vi.stubEnv('trackingApp_jwtPrivateKey', key);
    vi.stubEnv('TRACKINGAPP_JWTPRIVATEKEY', 'u'.repeat(32));
    const { getJwtSecret } = await import('./config.js');
    expect(getJwtSecret()).toEqual(new TextEncoder().encode(key));
  });

  it('reports a missing secret separately from insufficient length', async () => {
    const { getJwtSecret } = await import('./config.js');
    expect(getJwtSecret).toThrow('JWT secret is missing or empty');
  });

  it('does not silently override an empty legacy secret with its alias', async () => {
    vi.stubEnv('trackingApp_jwtPrivateKey', '');
    vi.stubEnv('TRACKINGAPP_JWTPRIVATEKEY', 'x'.repeat(32));
    const { getJwtSecret } = await import('./config.js');
    expect(getJwtSecret).toThrow('JWT secret is missing or empty');
  });

  it('rejects 31 bytes without including the secret in the error', async () => {
    const key = 'x'.repeat(31);
    vi.stubEnv('TRACKINGAPP_JWTPRIVATEKEY', key);
    const { getJwtSecret } = await import('./config.js');
    expect(getJwtSecret).toThrow('must be at least 32 UTF-8 bytes');
    expect(getJwtSecret).not.toThrow(key);
  });

  it('measures UTF-8 bytes rather than character count', async () => {
    const key = '\u00e9'.repeat(16);
    vi.stubEnv('TRACKINGAPP_JWTPRIVATEKEY', key);
    const { getJwtSecret } = await import('./config.js');
    expect(getJwtSecret()).toHaveLength(32);
  });
});
