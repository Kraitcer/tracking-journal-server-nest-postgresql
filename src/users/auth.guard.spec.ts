import { HttpStatus, type ExecutionContext } from '@nestjs/common';
import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from './auth.guard.js';

const secret = new TextEncoder().encode(
  'unit-test-secret-with-at-least-32-bytes',
);

vi.mock('../config.js', () => ({
  getJwtSecret: () => secret,
}));

describe('AuthGuard', () => {
  const reflector = { getAllAndOverride: vi.fn() };
  const prisma = {
    user: { findFirst: vi.fn() },
    project: { findFirst: vi.fn() },
  };
  let guard: AuthGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' });
    guard = new AuthGuard(reflector as never, prisma as never);
  });

  function createContext(
    request: Record<string, unknown>,
    controllerName = 'ProjectsController',
  ) {
    return {
      getHandler: () => ({}),
      getClass: () => ({ name: controllerName }),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('allows a public endpoint without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(
      guard.canActivate(createContext({ header: vi.fn() })),
    ).resolves.toBe(true);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('accepts a Bearer token for a resource owned by the user', async () => {
    const token = await new SignJWT({ _id: 'user-1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('tracking-journal')
      .setAudience('tracking-journal-api')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);
    const request = {
      header: (name: string) =>
        name === 'authorization' ? `Bearer ${token}` : undefined,
      params: { id: 'project-1' },
      query: {},
      body: {},
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request).toHaveProperty('user', { _id: 'user-1', id: 'user-1' });
  });

  it('rejects access to a resource owned by another user', async () => {
    const token = await new SignJWT({ _id: 'user-1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('tracking-journal')
      .setAudience('tracking-journal-api')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);
    prisma.project.findFirst.mockResolvedValue(null);
    const request = {
      header: (name: string) =>
        name === 'authorization' ? `Bearer ${token}` : undefined,
      params: { id: 'other-users-project' },
      query: {},
      body: {},
    };

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
  });

  it('rejects tokens without an expiration claim', async () => {
    const token = await new SignJWT({ _id: 'user-1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('tracking-journal')
      .setAudience('tracking-journal-api')
      .setIssuedAt()
      .sign(secret);
    const request = {
      header: (name: string) =>
        name === 'authorization' ? `Bearer ${token}` : undefined,
      params: {},
      query: {},
      body: {},
    };

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
  });
});
