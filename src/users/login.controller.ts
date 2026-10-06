import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public, type Body as Payload } from '../common/http.js';
import { JoiValidationPipe } from '../common/joi-validation.pipe.js';
import { UsersService } from './users.service.js';
import { googleLoginSchema, loginSchema } from './dto/create-user.dto.js';

@Controller('users/login')
export class LoginController {
  constructor(private readonly usersService: UsersService) {}

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
