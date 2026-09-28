import { HttpStatus, Injectable } from '@nestjs/common';
import { type Body, httpError, joiValidate } from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';
import { journalJoiSchema } from './journal.schema.js';

function mapJournal(journal: Body): Body {
  const { id, _id, ...rest } = journal;
  delete rest.journal_footer;
  delete rest.padMode;
  return { id: id ?? _id, ...rest };
}

function toResponse(journal: Body): Body {
  const { id, _id, ...rest } = journal;
  return { id: id ?? _id, padMode: 'mainPad', ...rest };
}

const NAVIGATION_VALUES = ['previousPage', 'nextPage', ''];

@Injectable()
export class JournalsService {
  constructor(private readonly prisma: PrismaService) {}

  create(body: Body) {
    const payload = mapJournal(body);
    joiValidate(journalJoiSchema, payload);
    return this.prisma.journal.create({ data: payload });
  }

  async findByUser(userId: string) {
    const journals = await this.prisma.journal.findMany({
      where: { user_id: userId },
    });
    return journals.map((journal) => toResponse(journal));
  }

  async updateFreeDays(id: string, body: Body) {
    if (!Array.isArray(body.free_days)) {
      throw httpError(HttpStatus.BAD_REQUEST, 'free_days must be an array');
    }
    const journal = await this.prisma.journal.updateMany({
      where: { id },
      data: { free_days: body.free_days },
    });
    if (!journal) throw httpError(HttpStatus.NOT_FOUND, 'Journal not found');
    if (!journal.count)
      throw httpError(HttpStatus.NOT_FOUND, 'Journal not found');
    return this.prisma.journal.findUnique({ where: { id } });
  }

  async updatePageId(id: string, body: Body) {
    const { date, page, page_id } = body;
    if (!date || !page || !page_id) {
      throw httpError(
        HttpStatus.BAD_REQUEST,
        'date, page and page_id are required',
      );
    }
    const journal = await this.prisma.journal.findUnique({ where: { id } });
    if (!journal)
      throw httpError(HttpStatus.NOT_FOUND, 'Journal page not found');
    const pages = journal.journal_pages as Body[];
    const entry = pages.find(
      (item) => item.date === date && item.page === page,
    );
    if (!entry) {
      throw httpError(HttpStatus.NOT_FOUND, 'Journal page not found');
    }
    entry.page_id = page_id;
    const updated = await this.prisma.journal.update({
      where: { id },
      data: { journal_pages: pages },
    });
    return toResponse(updated);
  }

  async updatePage(id: string, body: Body) {
    const { date, page, page_id, navigation } = body;
    if (!date || !page) {
      throw httpError(HttpStatus.BAD_REQUEST, 'date and page are required');
    }

    const journal = await this.prisma.journal.findUnique({ where: { id } });
    if (!journal) throw httpError(HttpStatus.NOT_FOUND, 'Journal not found');

    const pages = journal.journal_pages as Body[];
    // date+page is unique per entry; page_id can be shared (free day pair), so it must not take priority.
    const index = pages.findIndex((p) => p.date === date && p.page === page);
    if (index === -1) {
      throw httpError(HttpStatus.NOT_FOUND, 'Journal page not found');
    }

    if (page_id !== undefined) {
      pages[index].page_id = page_id;
    }

    if (navigation === 'currentPage') {
      pages.forEach((p) => {
        p.navigation = '';
      });
      if (pages[index - 1]) pages[index - 1].navigation = 'previousPage';
      pages[index].navigation = 'currentPage';
      if (pages[index + 1]) pages[index + 1].navigation = 'nextPage';
    } else if (NAVIGATION_VALUES.includes(navigation)) {
      pages[index].navigation = navigation;
    }

    const updated = await this.prisma.journal.update({
      where: { id },
      data: { journal_pages: pages },
    });
    return toResponse(updated);
  }

  async update(id: string, body: Body) {
    const payload = mapJournal(body);
    joiValidate(journalJoiSchema, payload);
    const result = await this.prisma.journal.updateMany({
      where: { id },
      data: payload,
    });
    if (!result.count)
      throw httpError(HttpStatus.NOT_FOUND, 'Journal not found');
    const updated = await this.prisma.journal.findUnique({ where: { id } });
    if (!updated) throw httpError(HttpStatus.NOT_FOUND, 'Journal not found');
    return toResponse(updated);
  }

  async remove(id: string) {
    const journal = await this.prisma.journal.findUnique({ where: { id } });
    if (!journal) throw httpError(HttpStatus.NOT_FOUND, 'Journal not found');

    const deleted = await this.prisma.$transaction(async (transaction) => {
      const [morning, evening, planning, review, free] = await Promise.all([
        transaction.morningPage.deleteMany({ where: { journal_id: id } }),
        transaction.eveningPage.deleteMany({ where: { journal_id: id } }),
        transaction.planningNextWeekPage.deleteMany({
          where: { journal_id: id },
        }),
        transaction.weekInReviewPage.deleteMany({ where: { journal_id: id } }),
        transaction.freeDay.deleteMany({ where: { journal_id: id } }),
      ]);
      await transaction.journal.delete({ where: { id } });
      return { morning, evening, planning, review, free };
    });

    return {
      id,
      deleted: {
        journals: 1,
        morningPages: deleted.morning.count,
        eveningPages: deleted.evening.count,
        planningNextWeekPages: deleted.planning.count,
        weekInReviewPages: deleted.review.count,
        freeDays: deleted.free.count,
      },
    };
  }
}
