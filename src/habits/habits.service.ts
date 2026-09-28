import { HttpStatus, Injectable } from '@nestjs/common';
import { type Body, httpError, joiValidate } from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';
import { habitJoiSchema } from './habit.schema.js';

function mapHabitFields(body: Body): Body {
  const { id, user_id, name, direction, status, type } = body;
  return { id, user_id, name, direction, status, type };
}

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  create(body: Body) {
    const payload = mapHabitFields(body);
    joiValidate(habitJoiSchema, payload);
    return this.prisma.habit.create({ data: payload });
  }

  async findByUser(userId: string) {
    const habits = await this.prisma.habit.findMany({
      where: { user_id: userId },
      orderBy: { name: 'asc' },
    });
    return habits.map(({ id, user_id, name, direction, status }) => ({
      id,
      user_id,
      name,
      direction,
      status,
    }));
  }

  async update(id: string, body: Body) {
    const payload = mapHabitFields(body);
    joiValidate(habitJoiSchema, payload);
    // Returns the document before the update, as the old server did.
    const habit = await this.prisma.habit.findUnique({ where: { id } });
    if (!habit) {
      throw httpError(HttpStatus.NOT_FOUND, "Can't store the habit...");
    }
    await this.prisma.habit.update({ where: { id }, data: payload });
    return habit;
  }

  async remove(id: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id } });
    if (!habit) {
      throw httpError(HttpStatus.NOT_FOUND, "Can't delete the habit...");
    }
    await this.prisma.habit.delete({ where: { id } });
    return habit;
  }
}
