import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { type Body, httpError, joiValidate } from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';
import { fetusJoiSchema, projectJoiSchema } from './project.schema.js';

const DEFAULT_FETUS = {
  fun: 0,
  effect: 0,
  time: 0,
  urgency: 0,
  strategy: 0,
  total: 0,
};

function mapProjectFields(body: Body): Body {
  const {
    id,
    _id,
    user_id,
    projectName,
    date_created,
    description,
    completed,
    fetusIndex,
  } = body;
  return {
    id: id ?? _id,
    user_id,
    projectName,
    date_created,
    description,
    completed,
    fetusIndex,
  };
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(body: Body) {
    joiValidate(projectJoiSchema, body);
    return this.prisma.project.create({
      data: mapProjectFields(body) as Prisma.ProjectUncheckedCreateInput,
    });
  }

  async findByUser(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { user_id: userId },
      orderBy: { priority: 'asc' },
    });

    return Promise.all(
      projects.map(async (project) => {
        const byProject = { currentProjectID: project.id };
        const [
          queueTasksCount,
          developmentTasksCount,
          doneTasksCount,
          totalTasksCount,
          fetus,
        ] = await Promise.all([
          this.prisma.goal.count({ where: { ...byProject, status: 'queue' } }),
          this.prisma.goal.count({
            where: { ...byProject, status: 'development' },
          }),
          this.prisma.goal.count({ where: { ...byProject, status: 'done' } }),
          this.prisma.goal.count({ where: byProject }),
          this.prisma.fetus.findFirst({
            where: { projectID: project.id },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        return {
          ...project,
          id: project.id,
          FETUSIndex: fetus !== null ? fetus.fetusIndex : DEFAULT_FETUS,
          queueTasksCount,
          developmentTasksCount,
          doneTasksCount,
          done:
            totalTasksCount > 0 ? (doneTasksCount / totalTasksCount) * 100 : 0,
        };
      }),
    );
  }

  async reorder(body: Body) {
    const { userId, projectOrder } = body;
    try {
      const projects = await this.prisma.project.findMany({
        where: { user_id: userId },
      });
      const orderMap = new Map<string, number>(
        (projectOrder as Body[]).map((project, index) => [project._id, index]),
      );

      await Promise.all(
        projects.map(async (project) => {
          const priority = orderMap.get(project.id);
          if (priority !== undefined) {
            await this.prisma.project.update({
              where: { id: project.id },
              data: { priority },
            });
          }
        }),
      );

      return { message: 'Project order updated successfully' };
    } catch (error) {
      console.error('Error updating project order:', error);
      throw httpError(HttpStatus.INTERNAL_SERVER_ERROR, {
        error: 'Internal Server Error',
      });
    }
  }

  async saveFetus(body: Body) {
    joiValidate(fetusJoiSchema, body);
    try {
      const { projectID, fetusIndex } = body;
      return await this.prisma.fetus.create({
        data: { projectID, fetusIndex },
      });
    } catch (err) {
      console.error('Error saving FETUS of project:', err);
      throw httpError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Error saving FETUS of project',
      );
    }
  }

  async update(id: string, body: Body) {
    const payload = mapProjectFields(body);
    joiValidate(projectJoiSchema, payload);
    const result = await this.prisma.project.updateMany({
      where: { id },
      data: payload,
    });
    if (!result.count) {
      throw httpError(HttpStatus.NOT_FOUND, "Can't store the project...");
    }
    return this.prisma.project.findUnique({ where: { id } });
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw httpError(HttpStatus.NOT_FOUND, "Can't delete the project...");
    }
    await this.prisma.$transaction(async (transaction) => {
      const goals = await transaction.goal.findMany({
        where: { currentProjectID: id },
        select: { id: true },
      });
      const goalIds = goals.map((goal) => goal.id);
      const tasks = await transaction.task.findMany({
        where: {
          OR: [{ project_id: id }, { goal_id: { in: goalIds } }],
        },
        select: { id: true },
      });
      const taskIds = tasks.map((task) => task.id);

      await transaction.subTask.deleteMany({
        where: {
          OR: [
            { project_id: id },
            { goal_id: { in: goalIds } },
            { task_id: { in: taskIds } },
          ],
        },
      });
      await transaction.task.deleteMany({
        where: {
          OR: [{ project_id: id }, { goal_id: { in: goalIds } }],
        },
      });
      await transaction.goal.deleteMany({ where: { currentProjectID: id } });
      await transaction.project.delete({ where: { id } });
    });
    return project;
  }
}
