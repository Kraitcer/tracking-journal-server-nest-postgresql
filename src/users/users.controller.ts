import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public, type Body as Payload } from '../common/http.js';
import { UsersService } from './users.service.js';

type AuthenticatedRequest = Request & { user: { _id: string } };

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.usersService.findAll(req.user._id);
  }

  @Post('register')
  @Public()
  @HttpCode(200)
  register(@Body() body: Payload) {
    return this.usersService.register(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
