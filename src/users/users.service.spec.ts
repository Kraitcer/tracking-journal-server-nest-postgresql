import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service.js';

const secret = new TextEncoder().encode(
  'unit-test-secret-with-at-least-32-bytes',
);

vi.mock('../config.js', () => ({
  appConfig: { googleClientId: '' },
  getJwtSecret: () => secret,
}));

describe('UsersService authentication', () => {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsersService(prisma as never);
  });

  it('issues a signed JWT with issuer, audience, and a bounded lifetime', async () => {
    const password = await bcrypt.hash('correct horse battery staple', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      password,
    });

    const result = await service.login({
      email: 'user@example.com',
      password: 'correct horse battery staple',
    });
    const { payload } = await jwtVerify(result.token, secret, {
      issuer: 'tracking-journal',
      audience: 'tracking-journal-api',
    });

    expect(payload._id).toBe('user-1');
    expect(payload.exp).toBeGreaterThan(payload.iat!);
    expect(payload.exp! - payload.iat!).toBeLessThanOrEqual(30 * 24 * 60 * 60);
  });

  it('refuses credentials for inactive users', async () => {
    const password = await bcrypt.hash('correct horse battery staple', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'inactive-user',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: false,
      password,
    });

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'correct horse battery staple',
      }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('rejects legacy plaintext passwords until the database migration runs', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'legacy-user',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      password: 'legacy-password',
    });

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'legacy-password',
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not accept a client-selected user ID during registration', async () => {
    prisma.user.create.mockResolvedValue({
      id: 'server-generated-id',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileName: '',
      isActive: true,
    });

    const result = await service.register({
      _id: 'client-selected-id',
      email: 'user@example.com',
      password: 'correct horse battery staple',
      firstName: 'Test',
      lastName: 'User',
      profileName: 'Test User',
    });

    expect(prisma.user.create.mock.calls[0][0].data).not.toHaveProperty('id');
    expect(result.user.id).toBe('server-generated-id');
  });
});
