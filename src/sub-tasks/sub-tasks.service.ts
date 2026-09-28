import { HttpStatus, Injectable } from '@nestjs/common';
import { type Body, httpError, joiValidate } from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';
import { subTaskJoiSchema } from './sub-task.schema.js';

const NOT_FOUND = 'Fucking fuck...';

@Injectable()
export class SubTasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findByGoal(goalId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { goal_id: goalId },
      select: { id: true },
    });
    const subTasks = await this.prisma.subTask.findMany({
      where: { task_id: { in: tasks.map((task) => task.id) } },
      select: {
        id: true,
        subTaskName: true,
        task_id: true,
        goal_id: true,
        project_id: true,
        description: true,
        completed: true,
      },
    });
    if (!subTasks.length) throw httpError(HttpStatus.NOT_FOUND, NOT_FOUND);
    return subTasks.map(({ id, ...task }) => ({
      id,
      ...task,
      description: task.description ?? '',
    }));
  }

  create(body: Body) {
    joiValidate(subTaskJoiSchema, body);
    return this.prisma.subTask.create({
      data: {
        id: body._id || body.id,
        subTaskName: body.subTaskName,
        task_id: body.task_id,
        goal_id: body.goal_id,
        project_id: body.project_id,
        description: body.description,
      },
    });
  }

  async update(id: string, body: Body) {
    joiValidate(subTaskJoiSchema, body);
    const subTask = await this.prisma.subTask.updateMany({
      where: { id },
      data: {
        subTaskName: body.subTaskName,
        task_id: body.task_id,
        goal_id: body.goal_id,
        project_id: body.project_id,
        description: body.description,
        completed: body.completed,
      },
    });
    if (!subTask.count) throw httpError(HttpStatus.NOT_FOUND, NOT_FOUND);
    return this.prisma.subTask.findUnique({ where: { id } });
  }

  async remove(id: string) {
    const subTask = await this.prisma.subTask.findUnique({ where: { id } });
    if (!subTask) throw httpError(HttpStatus.NOT_FOUND, NOT_FOUND);
    await this.prisma.subTask.delete({ where: { id } });
    return subTask;
  }

  async removeByTask(taskId: string) {
    const result = await this.prisma.subTask.deleteMany({
      where: { task_id: taskId },
    });
    return { deletedCount: result.count };
  }

  async removeByProject(projectId: string) {
    const result = await this.prisma.subTask.deleteMany({
      where: { project_id: projectId },
    });
    return { deletedCount: result.count };
  }
}
