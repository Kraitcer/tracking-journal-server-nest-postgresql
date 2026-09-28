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
import { MorningPagesService } from './morning-pages.service.js';

@Controller('morningPages')
export class MorningPagesController {
  constructor(private readonly morningPagesService: MorningPagesService) {}

  @Post()
  @HttpCode(200)
  create(@Body() body: Payload) {
    return this.morningPagesService.create(body);
  }

  @Get('many/:journal_id')
  findByJournal(@Param('journal_id') journalId: string) {
    return this.morningPagesService.findByJournal(journalId);
  }

  @Get('user/:user_id')
  findByUser(@Param('user_id') userId: string) {
    return this.morningPagesService.findByUser(userId);
  }

  @Get('one/:journal_id')
  findToday(@Param('journal_id') journalId: string) {
    return this.morningPagesService.findTodayByJournal(journalId);
  }

  @Get('one/journal/:journal_id')
  findTodayByJournal(@Param('journal_id') journalId: string) {
    return this.morningPagesService.findTodayByJournal(journalId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.morningPagesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.morningPagesService.remove(id);
  }
}
