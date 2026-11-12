import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoalsService } from './goals.service.js';
import { createDefaultSmartServey } from './smart-servey.js';

describe('GoalsService SMART survey', () => {
  const prisma = {
    goal: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    project: { findMany: vi.fn() },
    task: { groupBy: vi.fn() },
    subTask: { groupBy: vi.fn() },
  };
  let service: GoalsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GoalsService(prisma as never);
    prisma.goal.create.mockImplementation(async ({ data }) => data);
    prisma.goal.updateMany.mockResolvedValue({ count: 1 });
    prisma.task.groupBy.mockResolvedValue([]);
    prisma.subTask.groupBy.mockResolvedValue([]);
  });

  it('creates independent default surveys with template definitions and null values', () => {
    const first = createDefaultSmartServey();
    const second = createDefaultSmartServey();
    expect(Object.keys(first)).toEqual([
      'specific',
      'mesurable',
      'actionable',
      'resonable',
      'timeBound',
    ]);
    for (const criterion of Object.values(first)) {
      const { status, definition, ...rest } = criterion;
      expect(status).toBe('newGoal');
      expect(definition).toMatch(/^\(.+\):\nGoals should /);
      expect(Object.values(rest)).toEqual([null, null]);
    }
    first.specific.status = 'corresponds';
    expect(second.specific.status).toBe('newGoal');
  });

  it('keeps the Prisma and migration defaults identical to the API template', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8');
    const match = schema.match(
      /smart\s+Json\s+@default\(("(?:\\.|[^"\\])*")\)/,
    );
    expect(match).not.toBeNull();
    expect(JSON.parse(JSON.parse(match![1]))).toEqual(
      createDefaultSmartServey(),
    );
    const migration = readFileSync(
      'prisma/migrations/20261110000000_add_goal_smart_servey/migration.sql',
      'utf8',
    );
    const json = migration.match(/DEFAULT '([\s\S]+)'::jsonb/);
    expect(json).not.toBeNull();
    expect(JSON.parse(json![1])).toEqual(createDefaultSmartServey());
  });

  it('initializes a goal when smart is omitted', async () => {
    const result = await service.create({ _id: 'goal-1', goalName: 'Read' });
    expect(result).toMatchObject({
      id: 'goal-1',
      goalName: 'Read',
      smart: createDefaultSmartServey(),
    });
  });

  it('persists a supplied survey on creation', async () => {
    const smart = createDefaultSmartServey();
    smart.specific.status = 'corresponds';
    smart.specific.currentNameConclusion = 'A specific goal';
    smart.specific.proposedNames = ['Read ten books'];
    expect(await service.create({ smart })).toMatchObject({ smart });
  });

  it('updates and returns the complete survey including nulls and suggestions', async () => {
    const smart = createDefaultSmartServey();
    smart.timeBound.status = 'corresponds';
    smart.timeBound.currentGoalConclusion = 'By December';
    smart.timeBound.proposedTimeFrames = ['2026-12-01'];
    smart.actionable.proposedActions = [];
    prisma.goal.findUnique.mockResolvedValue({ id: 'goal-1', smart });

    expect(await service.update('goal-1', { smart })).toEqual({
      id: 'goal-1',
      smart,
    });
    expect(prisma.goal.updateMany).toHaveBeenCalledWith({
      where: { id: 'goal-1' },
      data: { smart },
    });
  });

  it('does not overwrite smart when updating another field', async () => {
    await service.update('goal-1', { goalName: 'Updated' });
    expect(prisma.goal.updateMany).toHaveBeenCalledWith({
      where: { id: 'goal-1' },
      data: { goalName: 'Updated' },
    });
  });

  it.each([true, false, null, {}, { specific: { status: 'newGoal' } }])(
    'rejects invalid smart payload %j before writing',
    async (smart) => {
      expect(() => service.create({ smart })).toThrow();
      await expect(service.update('goal-1', { smart })).rejects.toMatchObject({
        status: 400,
      });
      expect(prisma.goal.create).not.toHaveBeenCalled();
      expect(prisma.goal.updateMany).not.toHaveBeenCalled();
    },
  );

  it.each([
    { status: 'invalid' },
    { currentNameConclusion: 123 },
    { proposedNames: [123] },
    { extra: 'unexpected' },
  ])('rejects invalid criterion fields %j', async (changes) => {
    const smart = createDefaultSmartServey();
    Object.assign(smart.specific, changes);
    await expect(service.update('goal-1', { smart })).rejects.toMatchObject({
      status: 400,
    });
    expect(prisma.goal.updateMany).not.toHaveBeenCalled();
  });

  it('preserves SMART data in project and user goal responses', async () => {
    const goals = [{ id: 'goal-1', smart: createDefaultSmartServey() }];
    prisma.goal.findMany.mockResolvedValue(goals);
    prisma.project.findMany.mockResolvedValue([{ id: 'project-1' }]);
    expect(await service.findByProject('project-1')).toMatchObject(goals);
    expect(await service.findByUser('user-1')).toMatchObject(goals);
  });

  it('retains the not-found response for SMART updates', async () => {
    prisma.goal.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.update('missing', { smart: createDefaultSmartServey() }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
