import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { DateTime } from 'luxon';
import {
  type Body,
  httpError,
  joiValidate,
  toPlain,
  withoutUndefined,
} from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';
import { morningPageJoiSchema } from './morning-page.schema.js';

function mapFields(body: Body): Body {
  const {
    id,
    _id,
    user_id,
    journal_id,
    pageDate,
    display,
    finalized,
    selectedProject,
    selectedGoal,
    wakeUpTime,
    wokeUpEnergized,
    hungryForAction,
    hungryForActions,
    sleeprRating,
    todayProjectsAndGoals,
  } = body;

  const mapped: Body = {
    id: id ?? _id,
    user_id,
    journal_id,
    pageDate,
    display,
    finalized,
    selectedProject,
    selectedGoal,
    wakeUpTime,
    wokeUpEnergized,
    hungryForAction: hungryForAction ?? hungryForActions,
    sleeprRating,
  };
  if (todayProjectsAndGoals !== undefined) {
    mapped.todayProjectsAndGoals = todayProjectsAndGoals;
  }
  return mapped;
}

function toResponse(page: unknown): Body | null {
  if (!page) return null;
  const { id, hungryForAction, ...rest } = toPlain(page);
  return {
    id,
    ...rest,
    hungryForActions: hungryForAction,
    todayProjectsAndGoals: rest.todayProjectsAndGoals ?? [],
  };
}

@Injectable()
export class MorningPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: Body) {
    const payload = mapFields(body);
    joiValidate(morningPageJoiSchema, payload);
    return toResponse(
      await this.prisma.morningPage.create({
        data: payload as Prisma.MorningPageUncheckedCreateInput,
      }),
    );
  }

  async findByJournal(journalId: string) {
    const pages = await this.prisma.morningPage.findMany({
      where: { journal_id: journalId },
      orderBy: { createdAt: 'desc' },
    });
    return pages.map(toResponse);
  }

  async findByUser(userId: string) {
    const pages = await this.prisma.morningPage.findMany({
      where: { user_id: userId },
      orderBy: { pageDate: 'asc' },
    });
    return pages.map(toResponse);
  }

  async findTodayByJournal(journalId: string) {
    const page = await this.prisma.morningPage.findFirst({
      where: {
        journal_id: journalId,
        createdAt: {
          gte: DateTime.local().startOf('day').toJSDate(),
          lte: DateTime.local().endOf('day').toJSDate(),
        },
      },
    });
    if (!page) {
      throw httpError(HttpStatus.NOT_FOUND, 'Morning page for today not found');
    }
    return toResponse(page);
  }

  async update(id: string, body: Body) {
    const { id: _pageId, ...payload } = mapFields({ ...body, id });
    const pageId = _pageId as string;
    const page = await this.prisma.morningPage.updateMany({
      where: { id: pageId },
      data: withoutUndefined(payload),
    });
    if (!page.count)
      throw httpError(HttpStatus.NOT_FOUND, 'Morning page not found');
    return toResponse(
      await this.prisma.morningPage.findUnique({ where: { id: pageId } }),
    );
  }

  async remove(id: string) {
    const page = await this.prisma.morningPage.findUnique({ where: { id } });
    if (!page) throw httpError(HttpStatus.NOT_FOUND, 'Morning page not found');
    await this.prisma.morningPage.delete({ where: { id } });
    return { id };
  }
}
