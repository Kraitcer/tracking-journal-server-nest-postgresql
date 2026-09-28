import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import type { Body as Payload } from '../common/http.js';
import { UsersService } from './users.service.js';

@Controller('users/login')
export class LoginController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(200)
  login(@Body() body: Payload) {
    return this.usersService.login(body);
  }

  @Post('google')
  @HttpCode(200)
  googleLogin(@Body() body: Payload) {
    return this.usersService.googleLogin(body);
  }
}
