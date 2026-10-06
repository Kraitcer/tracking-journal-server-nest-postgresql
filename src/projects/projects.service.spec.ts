import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsService } from './projects.service.js';

describe('ProjectsService.remove', () => {
  const transaction = {
    goal: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    subTask: {
      deleteMany: vi.fn(),
    },
    project: {
      delete: vi.fn(),
    },
  };
  const prisma = {
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  let service: ProjectsService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
    prisma.project.findMany.mockResolvedValue([{ id: 'project-1' }]);
    prisma.$transaction.mockImplementation((operation) =>
      operation(transaction),
    );
    transaction.goal.findMany.mockResolvedValue([{ id: 'goal-1' }]);
    transaction.task.findMany.mockResolvedValue([{ id: 'task-1' }]);
    service = new ProjectsService(prisma as never);
  });

  it('deletes project tasks and subtasks in the same transaction', async () => {
    await service.remove('project-1');

    expect(transaction.task.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [{ project_id: 'project-1' }, { goal_id: { in: ['goal-1'] } }],
      },
    });
    expect(transaction.subTask.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { project_id: 'project-1' },
          { goal_id: { in: ['goal-1'] } },
          { task_id: { in: ['task-1'] } },
        ],
      },
    });
    expect(transaction.project.delete).toHaveBeenCalledWith({
      where: { id: 'project-1' },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });
});

describe('ProjectsService.reorder', () => {
  const prisma = {
    project: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  let service: ProjectsService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.project.findMany.mockResolvedValue([
      { id: 'project-1' },
      { id: 'project-2' },
    ]);
    prisma.project.updateMany.mockResolvedValue({ count: 1 });
    service = new ProjectsService(prisma as never);
  });

  it('scopes lookup and every update to the authenticated user', async () => {
    await service.reorder('user-1', {
      userId: 'other-user',
      projectOrder: [{ _id: 'project-2' }, { _id: 'project-1' }],
    });

    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { user_id: 'user-1', id: { in: ['project-2', 'project-1'] } },
      select: { id: true },
    });
    expect(prisma.project.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'project-2', user_id: 'user-1' },
      data: { priority: 0 },
    });
    expect(prisma.project.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'project-1', user_id: 'user-1' },
      data: { priority: 1 },
    });
  });

  it('rejects project IDs not owned by the authenticated user', async () => {
    prisma.project.findMany.mockResolvedValue([]);

    await expect(
      service.reorder('user-1', { projectOrder: [{ _id: 'foreign-project' }] }),
    ).rejects.toMatchObject({ status: 403 });
    expect(prisma.project.updateMany).not.toHaveBeenCalled();
  });
});

describe('ProjectsService.findByUser', () => {
  const prisma = {
    project: { findMany: vi.fn() },
    goal: { groupBy: vi.fn() },
    $queryRaw: vi.fn(),
  };
  let service: ProjectsService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.project.findMany.mockResolvedValue([
      { id: 'project-1', projectName: 'First' },
      { id: 'project-2', projectName: 'Second' },
    ]);
    prisma.goal.groupBy.mockResolvedValue([
      {
        currentProjectID: 'project-1',
        status: 'queue',
        _count: { _all: 2 },
      },
      {
        currentProjectID: 'project-1',
        status: 'done',
        _count: { _all: 1 },
      },
      {
        currentProjectID: 'project-2',
        status: 'development',
        _count: { _all: 2 },
      },
    ]);
    prisma.$queryRaw.mockResolvedValue([
      { projectID: 'project-1', fetusIndex: { total: 15 } },
    ]);
    service = new ProjectsService(prisma as never);
  });

  it('preserves project response counters with batched aggregates', async () => {
    const result = await service.findByUser('user-1');

    expect(result).toEqual([
      {
        id: 'project-1',
        projectName: 'First',
        FETUSIndex: { total: 15 },
        queueTasksCount: 2,
        developmentTasksCount: 0,
        doneTasksCount: 1,
        done: (1 / 3) * 100,
      },
      {
        id: 'project-2',
        projectName: 'Second',
        FETUSIndex: {
          fun: 0,
          effect: 0,
          time: 0,
          urgency: 0,
          strategy: 0,
          total: 0,
        },
        queueTasksCount: 0,
        developmentTasksCount: 2,
        doneTasksCount: 0,
        done: 0,
      },
    ]);
    expect(prisma.goal.groupBy).toHaveBeenCalledOnce();
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });
});
