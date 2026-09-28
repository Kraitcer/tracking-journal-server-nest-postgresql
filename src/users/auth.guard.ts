import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '../config.js';
import { httpError } from '../common/http.js';

// Port of server/middleware/auth (x-auth-token). Not applied anywhere yet, same as the old server.
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const token = req.header('x-auth-token');
    if (!token) {
      throw httpError(
        HttpStatus.UNAUTHORIZED,
        'Access denied, no token provided ',
      );
    }
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      req.user = payload;
      return true;
    } catch {
      throw httpError(HttpStatus.BAD_REQUEST, 'invalid token');
    }
  }
}
