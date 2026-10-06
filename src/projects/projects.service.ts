import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
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
    if (projects.length === 0) return [];

    const projectIds = projects.map((project) => project.id);
    const [goalCounts, fetusRecords] = await Promise.all([
      this.prisma.goal.groupBy({
        by: ['currentProjectID', 'status'],
        where: { currentProjectID: { in: projectIds } },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<
        { projectID: string | null; fetusIndex: Prisma.JsonValue }[]
      >`
        SELECT DISTINCT ON ("projectID") "projectID", "fetusIndex"
        FROM "FETUS"
        WHERE "projectID" IN (${Prisma.join(projectIds)})
        ORDER BY "projectID", "createdAt" DESC
      `,
    ]);

    const countsByProject = new Map<
      string,
      { queue: number; development: number; done: number; total: number }
    >();
    for (const goalCount of goalCounts) {
      const projectId = goalCount.currentProjectID;
      if (!projectId) continue;
      const counts = countsByProject.get(projectId) ?? {
        queue: 0,
        development: 0,
        done: 0,
        total: 0,
      };
      counts.total += goalCount._count._all;
      if (goalCount.status === 'queue') counts.queue += goalCount._count._all;
      if (goalCount.status === 'development') {
        counts.development += goalCount._count._all;
      }
      if (goalCount.status === 'done') counts.done += goalCount._count._all;
      countsByProject.set(projectId, counts);
    }

    const fetusByProject = new Map<string, (typeof fetusRecords)[number]>();
    for (const fetus of fetusRecords) {
      if (fetus.projectID && !fetusByProject.has(fetus.projectID)) {
        fetusByProject.set(fetus.projectID, fetus);
      }
    }

    return projects.map((project) => {
      const counts = countsByProject.get(project.id) ?? {
        queue: 0,
        development: 0,
        done: 0,
        total: 0,
      };
      const fetus = fetusByProject.get(project.id);
      return {
        ...project,
        id: project.id,
        FETUSIndex: fetus ? fetus.fetusIndex : DEFAULT_FETUS,
        queueTasksCount: counts.queue,
        developmentTasksCount: counts.development,
        doneTasksCount: counts.done,
        done: counts.total > 0 ? (counts.done / counts.total) * 100 : 0,
      };
    });
  }

  async reorder(userId: string, body: Body) {
    const projectOrder = body.projectOrder;
    if (
      !Array.isArray(projectOrder) ||
      projectOrder.some(
        (project) => !project || typeof project._id !== 'string',
      )
    ) {
      throw httpError(HttpStatus.BAD_REQUEST, 'Invalid project order');
    }

    const projectIds = projectOrder.map((project: Body) => project._id);
    if (new Set(projectIds).size !== projectIds.length) {
      throw httpError(HttpStatus.BAD_REQUEST, 'Duplicate project IDs');
    }

    try {
      const projects = await this.prisma.project.findMany({
        where: { user_id: userId, id: { in: projectIds } },
        select: { id: true },
      });
      if (projects.length !== projectIds.length) {
        throw httpError(HttpStatus.FORBIDDEN, 'Access denied');
      }

      await Promise.all(
        projectIds.map((id, priority) =>
          this.prisma.project.updateMany({
            where: { id, user_id: userId },
            data: { priority },
          }),
        ),
      );

      return { message: 'Project order updated successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
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
