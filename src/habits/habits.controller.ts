import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { Body as Payload } from '../common/http.js';
import { HabitsService } from './habits.service.js';

@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  @HttpCode(200)
  create(@Body() body: Payload) {
    return this.habitsService.create(body);
  }

  @Get(':user_id')
  findByUser(@Param('user_id') userId: string) {
    return this.habitsService.findByUser(userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.habitsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.habitsService.remove(id);
  }
}
