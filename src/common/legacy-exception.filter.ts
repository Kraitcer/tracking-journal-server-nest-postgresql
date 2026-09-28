import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

// Mirrors the old Express server: string errors are sent as plain text, unknown errors as 500.
@Catch()
export class LegacyExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        res.status(status).send(body);
      } else {
        res.status(status).json(body);
      }
      return;
    }

    console.error(exception);
    res.status(500).send('Internal Server Error');
  }
}
