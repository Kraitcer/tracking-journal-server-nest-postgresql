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
    },
    $transaction: vi.fn(),
  };
  let service: ProjectsService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
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
