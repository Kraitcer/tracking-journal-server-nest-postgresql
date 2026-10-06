import { HttpStatus, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { SignJWT } from 'jose';
import { appConfig, getJwtSecret } from '../config.js';
import { type Body, httpError } from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';

const NOT_FOUND = 'Fucking fuck...';
const TOKEN_ISSUER = 'tracking-journal';
const TOKEN_AUDIENCE = 'tracking-journal-api';

function isBcryptHash(value: unknown): boolean {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

function normalizeName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

@Injectable()
export class UsersService {
  private readonly googleClient = appConfig.googleClientId
    ? new OAuth2Client(appConfig.googleClientId)
    : null;

  constructor(private readonly prisma: PrismaService) {}

  private generateAuthToken(user: { id: unknown }): Promise<string> {
    return new SignJWT({ _id: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(TOKEN_ISSUER)
      .setAudience(TOKEN_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(getJwtSecret());
  }

  findAll(userId: string) {
    return this.prisma.user.findMany({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        profileName: true,
        authProvider: true,
        googleId: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        profileName: true,
        authProvider: true,
        googleId: true,
      },
    });
    if (!user) throw httpError(HttpStatus.NOT_FOUND, NOT_FOUND);
    return user;
  }

  async register(body: Body) {
    try {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      const user = await this.prisma.user.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          profileName: body.profileName,
          password: hashedPassword,
          email: body.email,
          authProvider: 'local',
        },
      });
      const { id, email, firstName, lastName, profileName, isActive } = user;
      const token = await this.generateAuthToken(user);
      return {
        user: { id, email, firstName, lastName, profileName, isActive },
        token,
      };
    } catch (err) {
      console.error('ПРОВБЛЕМА в : router.post маршруте в модуле USER', err);
      throw httpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'ПРОВБЛЕМА в : router.post маршруте в модуле USER',
      );
    }
  }

  async update(id: string, body: Body) {
    const current = await this.prisma.user.findUnique({ where: { id } });
    if (!current) throw httpError(HttpStatus.NOT_FOUND, NOT_FOUND);
    const user = await this.prisma.user.update({
      where: { id },
      data: body.name === undefined ? {} : { profileName: body.name },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        profileName: true,
        authProvider: true,
        googleId: true,
      },
    });
    if (!user) throw httpError(HttpStatus.NOT_FOUND, NOT_FOUND);
    return user;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        profileName: true,
        authProvider: true,
        googleId: true,
      },
    });
    if (!user) throw httpError(HttpStatus.NOT_FOUND, NOT_FOUND);
    await this.prisma.user.delete({ where: { id } });
    return user;
  }

  async login(body: Body) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user) {
      throw httpError(HttpStatus.BAD_REQUEST, 'invalid email or password');
    }

    const validPassword =
      typeof user.password === 'string' &&
      isBcryptHash(user.password) &&
      (await bcrypt.compare(body.password, user.password));

    if (!validPassword) {
      throw httpError(HttpStatus.BAD_REQUEST, 'invalid email or password');
    }
    if (!user.isActive) {
      throw httpError(HttpStatus.UNAUTHORIZED, 'Account is inactive');
    }

    const { id, email, firstName, lastName, isActive } = user;
    const token = await this.generateAuthToken({ id });
    return { user: { id, email, firstName, lastName, isActive }, token };
  }

  async googleLogin(body: Body) {
    if (!this.googleClient || !appConfig.googleClientId) {
      console.error('GOOGLE login failed: googleClientId is not configured');
      throw httpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Google login is not configured',
      );
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: body.idToken,
        audience: appConfig.googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return this.unauthorized('Invalid Google token payload');
      }

      const googleId = payload.sub;
      const email = (payload.email || '').toLowerCase();
      if (!googleId || !email || !payload.email_verified) {
        return this.unauthorized('Google account email is not verified');
      }

      let user =
        (await this.prisma.user.findUnique({ where: { googleId } })) ??
        (await this.prisma.user.findUnique({ where: { email } }));

      if (user && !user.isActive) {
        return this.unauthorized('Account is inactive');
      }

      const firstName = normalizeName(
        payload.given_name || payload.name,
        'Google',
      );
      const lastName = normalizeName(payload.family_name, 'User');

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            profileName: normalizeName(payload.name, 'Google User'),
            authProvider: 'google',
            googleId,
          },
        });
      } else {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            email,
            firstName: normalizeName(user.firstName, firstName),
            lastName: normalizeName(user.lastName, lastName),
            authProvider: 'google',
            googleId,
          },
        });
      }

      const token = await this.generateAuthToken(user);
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
        },
        token,
      };
    } catch (err) {
      if (err instanceof UnauthorizedGoogleError) {
        throw httpError(HttpStatus.UNAUTHORIZED, err.message);
      }
      console.error('GOOGLE login error', err);
      throw httpError(HttpStatus.UNAUTHORIZED, 'Invalid Google token');
    }
  }

  private unauthorized(message: string): never {
    throw new UnauthorizedGoogleError(message);
  }
}

class UnauthorizedGoogleError extends Error {}
