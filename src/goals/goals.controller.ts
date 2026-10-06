import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Put,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Body as Payload } from '../common/http.js';
import { GoalsService } from './goals.service.js';

type AuthenticatedRequest = Request & { user: { _id: string } };

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get('allGoalsInfo')
  allGoalsInfo(@Req() req: AuthenticatedRequest) {
    return this.goalsService.allGoalsInfo(req.user._id);
  }

  @Get('of_project/:projectID')
  findByProject(@Param('projectID') projectID: string) {
    return this.goalsService.findByProject(projectID);
  }

  @Get('of_user/:user_id')
  findByUser(@Param('user_id') userId: string) {
    return this.goalsService.findByUser(userId);
  }

  @Post()
  @HttpCode(200)
  create(@Body() body: Payload) {
    return this.goalsService.create(body);
  }

  @Put('reorder')
  reorder(@Body() body: Payload) {
    return this.goalsService.reorder(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.goalsService.update(id, body);
  }

  @Delete('ofProject/:projectID')
  removeByProject(@Param('projectID') projectID: string) {
    return this.goalsService.removeByProject(projectID);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.goalsService.remove(id);
  }
}
