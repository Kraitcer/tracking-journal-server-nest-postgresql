import { HttpStatus, Injectable } from '@nestjs/common';
import { type Body, httpError, joiValidate } from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';
import { taskJoiSchema } from './task.schema.js';

const EDITABLE_FIELDS = [
  'taskName',
  'goal_id',
  'project_id',
  'description',
  'isEditing',
  'completed',
];

function toResponse(doc: Body) {
  return {
    id: doc.id,
    taskName: doc.taskName,
    goal_id: doc.goal_id,
    project_id: doc.project_id,
    description: doc.description || '',
    isEditing: Boolean(doc.isEditing),
    completed: Boolean(doc.completed),
  };
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findByGoal(goalId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { goal_id: goalId },
    });
    return tasks.map(toResponse);
  }

  async create(body: Body) {
    const payload = {
      id: body._id || body.id,
      taskName: body.taskName,
      goal_id: body.goal_id,
      project_id: body.project_id,
      description: body.description,
      isEditing: body.isEditing,
      completed: body.completed,
    };
    joiValidate(taskJoiSchema, payload);

    const task = await this.prisma.task.create({
      data: {
        ...payload,
        isEditing: Boolean(payload.isEditing),
        completed: Boolean(payload.completed),
      },
    });
    return toResponse(task);
  }

  async removeByGoal(goalId: string) {
    const result = await this.prisma.task.deleteMany({
      where: { goal_id: goalId },
    });
    return { deleted: result.count };
  }

  async removeByProject(projectId: string) {
    const result = await this.prisma.task.deleteMany({
      where: { project_id: projectId },
    });
    return { deleted: result.count };
  }

  async update(id: string, body: Body) {
    const changes = Object.fromEntries(
      EDITABLE_FIELDS.filter((key) => body[key] !== undefined).map((key) => [
        key,
        body[key],
      ]),
    );
    joiValidate(taskJoiSchema, { id, ...changes });

    const result = await this.prisma.task.updateMany({
      where: { id },
      data: changes,
    });
    if (!result.count) throw httpError(HttpStatus.NOT_FOUND, 'Task not found');
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw httpError(HttpStatus.NOT_FOUND, 'Task not found');
    return toResponse(task);
  }

  async remove(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw httpError(HttpStatus.NOT_FOUND, 'Task not found');
    await this.prisma.task.delete({ where: { id } });
    return toResponse(task);
  }
}
