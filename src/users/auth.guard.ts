import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { jwtVerify } from 'jose';
import { httpError, IS_PUBLIC_KEY } from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';
import { getJwtSecret } from '../config.js';

type AuthenticatedRequest = Request & {
  user?: { _id: string; id: string };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = req.header('authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : req.header('x-auth-token');
    if (!token) {
      throw httpError(HttpStatus.UNAUTHORIZED, 'Authentication required');
    }

    let userId: string;
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      if (typeof payload._id !== 'string' || !payload._id) throw new Error();
      userId = payload._id;
    } catch {
      throw httpError(HttpStatus.UNAUTHORIZED, 'Invalid token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: { id: true },
    });
    if (!user) throw httpError(HttpStatus.UNAUTHORIZED, 'Invalid user');

    req.user = { _id: user.id, id: user.id };
    await this.assertOwnership(context, req, user.id);
    return true;
  }

  private async assertOwnership(
    context: ExecutionContext,
    req: AuthenticatedRequest,
    userId: string,
  ) {
    const params = req.params as Record<string, unknown>;
    const query = req.query as Record<string, unknown>;
    const body = req.body as Record<string, unknown> | undefined;
    const sources = [params, query, body ?? {}];

    for (const source of sources) {
      for (const key of ['user_id', 'userId']) {
        const value = source[key];
        if (typeof value === 'string' && value && value !== userId) {
          throw httpError(HttpStatus.FORBIDDEN, 'Access denied');
        }
      }
      for (const [key, owns] of [
        ['journal_id', this.ownsJournal.bind(this)],
        ['project_id', this.ownsProject.bind(this)],
        ['projectID', this.ownsProject.bind(this)],
        ['currentProjectID', this.ownsProject.bind(this)],
        ['goal_id', this.ownsGoal.bind(this)],
        ['task_id', this.ownsTask.bind(this)],
      ] as const) {
        const value = source[key];
        if (
          typeof value === 'string' &&
          value &&
          !(await owns(value, userId))
        ) {
          throw httpError(HttpStatus.FORBIDDEN, 'Access denied');
        }
      }
    }

    const id = params.id;
    if (typeof id === 'string') {
      const controller = context.getClass().name;
      let owned = true;
      switch (controller) {
        case 'UsersController':
          owned = id === userId;
          break;
        case 'ProjectsController':
          owned = await this.ownsProject(id, userId);
          break;
        case 'HabitsController':
          owned = Boolean(
            await this.prisma.habit.findFirst({
              where: { id, user_id: userId },
              select: { id: true },
            }),
          );
          break;
        case 'JournalsController':
          owned = await this.ownsJournal(id, userId);
          break;
        case 'MorningPagesController':
          owned = Boolean(
            await this.prisma.morningPage.findFirst({
              where: { id, user_id: userId },
              select: { id: true },
            }),
          );
          break;
        case 'EveningPagesController':
          owned = Boolean(
            await this.prisma.eveningPage.findFirst({
              where: { id, user_id: userId },
              select: { id: true },
            }),
          );
          break;
        case 'FreeDaysController':
          owned = Boolean(
            await this.prisma.freeDay.findFirst({
              where: { id, user_id: userId },
              select: { id: true },
            }),
          );
          break;
        case 'WeekInReviewPagesController':
          owned = Boolean(
            await this.prisma.weekInReviewPage.findFirst({
              where: { id, user_id: userId },
              select: { id: true },
            }),
          );
          break;
        case 'PlanningNextWeekPagesController':
          owned = Boolean(
            await this.prisma.planningNextWeekPage.findFirst({
              where: { id, user_id: userId },
              select: { id: true },
            }),
          );
          break;
        case 'GoalsController':
          owned = await this.ownsGoal(id, userId);
          break;
        case 'TasksController':
          owned = await this.ownsTask(id, userId);
          break;
        case 'SubTasksController':
          owned = await this.ownsSubTask(id, userId);
          break;
        case 'DescriptionsController':
          owned = await this.ownsDescription(id, userId);
          break;
      }
      if (!owned) throw httpError(HttpStatus.FORBIDDEN, 'Access denied');
    }

    const descriptionEntity =
      typeof query.entity === 'string' ? query.entity : undefined;
    const descriptionId =
      typeof query.entity_id === 'string' ? query.entity_id : undefined;
    if (descriptionEntity && descriptionId) {
      const owned = await this.ownsEntity(
        descriptionEntity,
        descriptionId,
        userId,
      );
      if (!owned) throw httpError(HttpStatus.FORBIDDEN, 'Access denied');
    }

    const forEntity = body?.for as Record<string, unknown> | undefined;
    if (
      typeof forEntity?.entity === 'string' &&
      typeof forEntity.entity_id === 'string' &&
      !(await this.ownsEntity(forEntity.entity, forEntity.entity_id, userId))
    ) {
      throw httpError(HttpStatus.FORBIDDEN, 'Access denied');
    }
  }

  private async ownsProject(id: string, userId: string): Promise<boolean> {
    return Boolean(
      await this.prisma.project.findFirst({
        where: { id, user_id: userId },
        select: { id: true },
      }),
    );
  }

  private async ownsJournal(id: string, userId: string): Promise<boolean> {
    return Boolean(
      await this.prisma.journal.findFirst({
        where: { id, user_id: userId },
        select: { id: true },
      }),
    );
  }

  private async ownsGoal(id: string, userId: string): Promise<boolean> {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      select: { currentProjectID: true },
    });
    return goal?.currentProjectID
      ? this.ownsProject(goal.currentProjectID, userId)
      : false;
  }

  private async ownsTask(id: string, userId: string): Promise<boolean> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { project_id: true, goal_id: true },
    });
    if (task?.project_id) return this.ownsProject(task.project_id, userId);
    return task?.goal_id ? this.ownsGoal(task.goal_id, userId) : false;
  }

  private async ownsSubTask(id: string, userId: string): Promise<boolean> {
    const subTask = await this.prisma.subTask.findUnique({
      where: { id },
      select: { project_id: true, goal_id: true, task_id: true },
    });
    if (subTask?.project_id)
      return this.ownsProject(subTask.project_id, userId);
    if (subTask?.goal_id) return this.ownsGoal(subTask.goal_id, userId);
    return subTask?.task_id ? this.ownsTask(subTask.task_id, userId) : false;
  }

  private async ownsEntity(
    entity: string,
    id: string,
    userId: string,
  ): Promise<boolean> {
    switch (entity) {
      case 'project':
        return this.ownsProject(id, userId);
      case 'goal':
        return this.ownsGoal(id, userId);
      case 'task':
        return this.ownsTask(id, userId);
      case 'subTask':
        return this.ownsSubTask(id, userId);
      case 'habit':
        return Boolean(
          await this.prisma.habit.findFirst({
            where: { id, user_id: userId },
            select: { id: true },
          }),
        );
      default:
        return false;
    }
  }

  private async ownsDescription(id: string, userId: string): Promise<boolean> {
    const description = await this.prisma.description.findUnique({
      where: { id },
      select: { entity: true, entity_id: true },
    });
    return description
      ? this.ownsEntity(description.entity, description.entity_id, userId)
      : false;
  }
}
