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
import { JournalsService } from './journals.service.js';

@Controller('journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Post()
  @HttpCode(200)
  create(@Body() body: Payload) {
    return this.journalsService.create(body);
  }

  @Get(':user_id')
  findByUser(@Param('user_id') userId: string) {
    return this.journalsService.findByUser(userId);
  }

  @Put(':id/free-days')
  updateFreeDays(@Param('id') id: string, @Body() body: Payload) {
    return this.journalsService.updateFreeDays(id, body);
  }

  @Put(':id/page-id')
  updatePageId(@Param('id') id: string, @Body() body: Payload) {
    return this.journalsService.updatePageId(id, body);
  }

  @Put(':id/page')
  updatePage(@Param('id') id: string, @Body() body: Payload) {
    return this.journalsService.updatePage(id, body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.journalsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.journalsService.remove(id);
  }
}
