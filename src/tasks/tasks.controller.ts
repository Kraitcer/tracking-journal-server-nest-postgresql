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
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':goal_id')
  findByGoal(@Param('goal_id') goalId: string) {
    return this.tasksService.findByGoal(goalId);
  }

  @Post()
  @HttpCode(200)
  create(@Body() body: Payload) {
    return this.tasksService.create(body);
  }

  @Delete('ofTask/:goal_id')
  removeByGoal(@Param('goal_id') goalId: string) {
    return this.tasksService.removeByGoal(goalId);
  }

  @Delete('ofProject/:project_id')
  removeByProject(@Param('project_id') projectId: string) {
    return this.tasksService.removeByProject(projectId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.tasksService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
