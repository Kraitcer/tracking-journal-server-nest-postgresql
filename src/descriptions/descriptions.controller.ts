import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { Body as Payload } from '../common/http.js';
import { DescriptionsService } from './descriptions.service.js';

@Controller('descriptions')
export class DescriptionsController {
  constructor(private readonly descriptionsService: DescriptionsService) {}

  @Get()
  findByEntity(@Query() query: Payload) {
    return this.descriptionsService.findByEntity(query);
  }

  @Post()
  @HttpCode(200)
  create(@Body() body: Payload) {
    return this.descriptionsService.create(body);
  }

  @Put('reorder')
  reorder() {
    // Reorder is currently not used for descriptions.
    return { message: 'No reordering required for descriptions' };
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.descriptionsService.update(id, body);
  }

  @Delete('by-entity')
  removeByEntity(@Query() query: Payload) {
    return this.descriptionsService.removeByEntity(query);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.descriptionsService.remove(id);
  }
}
