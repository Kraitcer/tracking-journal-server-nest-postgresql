import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { httpError } from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';

@Controller('mainBord')
export class MainBordController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':user_id')
  async getSummary(@Param('user_id') user_id: string) {
    try {
      const projects = await this.prisma.project.findMany({
        where: { user_id },
        select: { id: true },
      });
      const projectIds = projects.map((project) => project.id);

      const [
        goodHabits,
        badHabits,
        completeProjects,
        incompleteProjects,
        queueTasksCount,
        developmentTasksCount,
        doneTasksCount,
      ] = await Promise.all([
        this.prisma.habit.count({ where: { user_id, direction: 'good' } }),
        this.prisma.habit.count({ where: { user_id, direction: 'bad' } }),
        this.prisma.project.count({ where: { user_id, completed: true } }),
        this.prisma.project.count({ where: { user_id, completed: false } }),
        this.prisma.goal.count({
          where: { currentProjectID: { in: projectIds }, status: 'queue' },
        }),
        this.prisma.goal.count({
          where: {
            currentProjectID: { in: projectIds },
            status: 'development',
          },
        }),
        this.prisma.goal.count({
          where: { currentProjectID: { in: projectIds }, status: 'done' },
        }),
      ]);

      return {
        totalProjects: projectIds.length,
        completeProjects,
        incompleteProjects,
        queueTasksCount,
        developmentTasksCount,
        doneTasksCount,
        goodHabits,
        badHabits,
      };
    } catch (err) {
      console.error('Проблема в GET модуля LOGIN', err);
      throw httpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Проблема в GET модуля LOGIN',
      );
    }
  }
}
