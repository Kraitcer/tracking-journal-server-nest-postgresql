import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import {
  type Body,
  httpError,
  joiValidate,
  withIdField,
  withoutUndefined,
} from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';
import { eveningPageJoiSchema } from './evening-page.schema.js';

@Injectable()
export class EveningPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: Body) {
    const { id, _id, ...rest } = body;
    const payload = { id: id ?? _id, ...rest };
    joiValidate(eveningPageJoiSchema, payload);
    const page = await this.prisma.eveningPage.create({
      data: payload as Prisma.EveningPageUncheckedCreateInput,
    });
    return withIdField(page);
  }

  async findByUser(userId: string | undefined) {
    if (!userId) {
      throw httpError(
        HttpStatus.BAD_REQUEST,
        'user_id query parameter is required',
      );
    }
    const pages = await this.prisma.eveningPage.findMany({
      where: { user_id: userId },
    });
    return pages.map(withIdField);
  }

  async findByJournal(journalId: string) {
    const pages = await this.prisma.eveningPage.findMany({
      where: { journal_id: journalId },
    });
    return pages.map(withIdField);
  }

  async update(id: string, body: Body) {
    const changes = withoutUndefined(body);
    delete changes.id;
    delete changes._id;

    const result = await this.prisma.eveningPage.updateMany({
      where: { id },
      data: changes,
    });
    if (!result.count)
      throw httpError(HttpStatus.NOT_FOUND, 'Evening page not found');
    const page = await this.prisma.eveningPage.findUnique({ where: { id } });
    return withIdField(page);
  }
}
