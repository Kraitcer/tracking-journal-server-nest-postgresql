import { type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { appConfig } from '../config.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthGuard } from './auth.guard.js';
import { LoginController } from './login.controller.js';
import { UsersService } from './users.service.js';

vi.mock('../config.js', () => ({
  appConfig: { googleClientId: 'test.apps.googleusercontent.com' },
}));

describe('Google login configuration endpoint', () => {
  let app: INestApplication;
  const usersService = { login: vi.fn(), googleLogin: vi.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
      controllers: [LoginController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: PrismaService, useValue: {} },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    appConfig.googleClientId = 'test.apps.googleusercontent.com';
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns only the public client ID without requiring authentication', async () => {
    await request(app.getHttpServer())
      .get('/api/users/login/google/config')
      .expect(200)
      .expect({ clientId: 'test.apps.googleusercontent.com' });
    expect(usersService.googleLogin).not.toHaveBeenCalled();
  });

  it('reports an unconfigured server instead of returning an empty client ID', async () => {
    appConfig.googleClientId = '';
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await request(app.getHttpServer())
        .get('/api/users/login/google/config')
        .expect(503);
      expect(response.body.message).toBe('Google login is not configured');
      expect(log).toHaveBeenCalledWith(
        'GOOGLE login configuration failed: GOOGLE_CLIENT_ID is not configured',
      );
    } finally {
      log.mockRestore();
    }
  });

  it('preserves the Google token login route', async () => {
    usersService.googleLogin.mockResolvedValue({ token: 'app-token' });
    await request(app.getHttpServer())
      .post('/api/users/login/google')
      .send({ idToken: 'google-id-token' })
      .expect(200)
      .expect({ token: 'app-token' });
    expect(usersService.googleLogin).toHaveBeenCalledWith({
      idToken: 'google-id-token',
    });
  });

  it('preserves password login when Google login is unconfigured', async () => {
    appConfig.googleClientId = '';
    usersService.login.mockResolvedValue({ token: 'password-token' });
    await request(app.getHttpServer())
      .post('/api/users/login')
      .send({ email: 'user@example.com', password: 'valid-password' })
      .expect(200)
      .expect({ token: 'password-token' });
    expect(usersService.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'valid-password',
    });
  });
});
