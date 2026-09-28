import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { Body as Payload } from '../common/http.js';
import { EveningPagesService } from './evening-pages.service.js';

@Controller('eveningPages')
export class EveningPagesController {
  constructor(private readonly eveningPagesService: EveningPagesService) {}

  @Post()
  @HttpCode(200)
  create(@Body() body: Payload) {
    return this.eveningPagesService.create(body);
  }

  @Get()
  findByUser(@Query('user_id') userId?: string) {
    return this.eveningPagesService.findByUser(userId);
  }

  @Get('journal/:journal_id')
  findByJournal(@Param('journal_id') journalId: string) {
    return this.eveningPagesService.findByJournal(journalId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.eveningPagesService.update(id, body);
  }

  // Kept for backward compatibility with GET /eveningPages/:journal_id.
  @Get(':journal_id')
  findByJournalLegacy(@Param('journal_id') journalId: string) {
    return this.eveningPagesService.findByJournal(journalId);
  }
}
