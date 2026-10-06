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
import type { Body as Payload } from '../common/http.js';
import { ProjectsService } from './projects.service.js';

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(200)
  create(@Body() body: Payload) {
    return this.projectsService.create(body);
  }

  @Get(':user_id')
  findByUser(@Param('user_id') userId: string) {
    return this.projectsService.findByUser(userId);
  }

  @Put('reorder')
  reorder(@Req() req: AuthenticatedRequest, @Body() body: Payload) {
    return this.projectsService.reorder(req.user.id, body);
  }

  @Put(':id/fetus')
  saveFetus(@Body() body: Payload) {
    return this.projectsService.saveFetus(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.projectsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
