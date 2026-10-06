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
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public, type Body as Payload } from '../common/http.js';
import { JoiValidationPipe } from '../common/joi-validation.pipe.js';
import { createUserSchema } from './dto/create-user.dto.js';
import { updateUserSchema } from './dto/update-user.dto.js';
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
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(200)
  register(@Body(new JoiValidationPipe(createUserSchema)) body: Payload) {
    return this.usersService.register(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new JoiValidationPipe(updateUserSchema)) body: Payload,
  ) {
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
