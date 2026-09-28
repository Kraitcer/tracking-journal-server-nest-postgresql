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
import { SubTasksService } from './sub-tasks.service.js';

@Controller('subTasks')
export class SubTasksController {
  constructor(private readonly subTasksService: SubTasksService) {}

  @Get('ofGoal/:goal_id')
  findByGoal(@Param('goal_id') goalId: string) {
    return this.subTasksService.findByGoal(goalId);
  }

  @Post()
  @HttpCode(200)
  create(@Body() body: Payload) {
    return this.subTasksService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.subTasksService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subTasksService.remove(id);
  }

  @Delete('ofTask/:task_id')
  removeByTask(@Param('task_id') taskId: string) {
    return this.subTasksService.removeByTask(taskId);
  }

  @Delete('ofProject/:project_id')
  removeByProject(@Param('project_id') projectId: string) {
    return this.subTasksService.removeByProject(projectId);
  }
}
