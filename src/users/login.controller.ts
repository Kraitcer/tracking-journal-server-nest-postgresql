import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public, type Body as Payload } from '../common/http.js';
import { JoiValidationPipe } from '../common/joi-validation.pipe.js';
import { UsersService } from './users.service.js';
import { googleLoginSchema, loginSchema } from './dto/create-user.dto.js';
import { appConfig } from '../config.js';

@Controller('users/login')
export class LoginController {
  constructor(private readonly usersService: UsersService) {}

  @Get('google/config')
  @Public()
  googleConfig() {
    if (!appConfig.googleClientId) {
      console.error(
        'GOOGLE login configuration failed: GOOGLE_CLIENT_ID is not configured',
      );
      throw new ServiceUnavailableException('Google login is not configured');
    }
    return { clientId: appConfig.googleClientId };
  }

  @Post()
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  login(@Body(new JoiValidationPipe(loginSchema)) body: Payload) {
    return this.usersService.login(body);
  }

  @Post('google')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  googleLogin(@Body(new JoiValidationPipe(googleLoginSchema)) body: Payload) {
    return this.usersService.googleLogin(body);
  }
}
