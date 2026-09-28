import { HttpStatus, Injectable } from '@nestjs/common';
import { type Body, httpError, joiValidate } from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';
import { goalJoiSchema } from './goal.schema.js';

const NOT_FOUND = 'Fucking fuck...';

function mapGoalFields(body: Body): Body {
  const {
    id,
    _id,
    goalName,
    currentProjectID,
    description,
    status,
    padMode,
    creationDate,
    timeSpent,
    dueDate,
  } = body;
  return {
    id: id ?? _id,
    goalName,
    currentProjectID,
    description,
    status,
    padMode,
    creationDate,
    timeSpent,
    dueDate,
  };
}

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async allGoalsInfo() {
    const goals = await this.prisma.goal.findMany({
      select: { currentProjectID: true, status: true },
    });
    const grouped = new Map<
      string | null,
      { queueTasks: number; developmentTasks: number; doneTasks: number }
    >();
    for (const goal of goals) {
      const counts = grouped.get(goal.currentProjectID) ?? {
        queueTasks: 0,
        developmentTasks: 0,
        doneTasks: 0,
      };
      if (goal.status === 'queue') counts.queueTasks += 1;
      if (goal.status === 'development') counts.developmentTasks += 1;
      if (goal.status === 'done') counts.doneTasks += 1;
      grouped.set(goal.currentProjectID, counts);
    }
    return [...grouped].map(([currentProjectID, counts]) => ({
      currentProjectID,
      ...counts,
    }));
  }

  async findByProject(projectID: string) {
    const goals = await this.prisma.goal.findMany({
      where: { currentProjectID: projectID },
      orderBy: { priority: 'asc' },
    });
    return this.withCounters(goals);
  }

  async findByUser(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    const projectIDs = projects.map((project) => project.id);
    if (projectIDs.length === 0) return [];

    const goals = await this.prisma.goal.findMany({
      where: { currentProjectID: { in: projectIDs } },
      orderBy: { priority: 'asc' },
    });
    return this.withCounters(goals);
  }

  private withCounters(goals: any[]) {
    return Promise.all(
      goals.map(async (goal) => {
        const [subTasks, tasks] = await Promise.all([
          // Same filter as the old server (subTasks have no currentTaskID field).
          this.prisma.subTask.count({
            where: { goal_id: goal.id, completed: false },
          }),
          this.prisma.task.count({
            where: { goal_id: goal.id, completed: false },
          }),
        ]);
        // Stored fields are spread last, exactly like `...goal._doc` in the old server.
        return {
          id: goal.id,
          padMode: goal.padMode || 'goalsPageMain',
          subTasks,
          tasks,
          ...goal,
        };
      }),
    );
  }

  create(body: Body) {
    joiValidate(goalJoiSchema, body);
    return this.prisma.goal.create({ data: mapGoalFields(body) });
  }

  async reorder(body: Body) {
    const { currentProjectID, goalsOrder } = body;
    try {
      const goals = await this.prisma.goal.findMany({
        where: { currentProjectID },
      });
      const order = goalsOrder as Body[];
      const orderMap = new Map<string, number>(
        order.map((goal, index) => [goal._id, index]),
      );

      await Promise.all(
        goals.map(async (goal) => {
          const goalId = goal.id;
          const fromClient = order.find((el) => el._id === goalId);
          if (!fromClient) return;

          goal.status = fromClient.status;
          const priority = orderMap.get(goalId);
          if (priority !== undefined) goal.priority = priority;

          await this.prisma.goal.update({
            where: { id: goalId },
            data: { status: fromClient.status, priority },
          });
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

  async update(id: string, body: Body) {
    const changes = Object.fromEntries(
      Object.entries(body ?? {}).filter(([, value]) => value !== ''),
    );
    joiValidate(goalJoiSchema, changes);
    const result = await this.prisma.goal.updateMany({
      where: { id },
      data: changes,
    });
    if (!result.count) throw httpError(HttpStatus.NOT_FOUND, NOT_FOUND);
    return this.prisma.goal.findUnique({ where: { id } });
  }

  async removeByProject(projectID: string) {
    try {
      const result = await this.prisma.goal.deleteMany({
        where: { currentProjectID: projectID },
      });
      return { deletedCount: result.count };
    } catch (err) {
      console.error('Error deleting goals by project:', err);
      throw httpError(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: 'Internal Server Error',
      });
    }
  }

  async remove(id: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal) throw httpError(HttpStatus.NOT_FOUND, NOT_FOUND);
    await this.prisma.goal.delete({ where: { id } });
    return goal;
  }
}
