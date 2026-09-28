import { HttpStatus } from '@nestjs/common';
import type Joi from 'joi';
import {
  type Body,
  httpError,
  joiValidate,
  modelFromBody,
  withIdField,
  withoutUndefined,
} from './http.js';

export abstract class JournalPageService {
  protected constructor(
    protected readonly model: any,
    private readonly joiSchema: Joi.Schema,
    private readonly notFoundMessage: string,
  ) {}

  async findByUser(userId: string | undefined) {
    if (!userId) {
      throw httpError(
        HttpStatus.BAD_REQUEST,
        'user_id query parameter is required',
      );
    }
    const pages = await this.model.findMany({ where: { user_id: userId } });
    return pages.map(withIdField);
  }

  async findByJournal(journalId: string) {
    const pages = await this.model.findMany({
      where: { journal_id: journalId },
    });
    return pages.map(withIdField);
  }

  async create(body: Body) {
    const payload = modelFromBody(body);
    joiValidate(this.joiSchema, payload);
    const page = await this.model.create({ data: payload });
    return withIdField(page);
  }

  async update(id: string, body: Body) {
    const changes = withoutUndefined(body);
    delete changes.id;
    delete changes._id;

    const result = await this.model.updateMany({
      where: { id },
      data: changes,
    });
    if (!result.count)
      throw httpError(HttpStatus.NOT_FOUND, this.notFoundMessage);
    const page = await this.model.findUnique({ where: { id } });
    return withIdField(page);
  }

  async remove(id: string): Promise<void> {
    const result = await this.model.deleteMany({ where: { id } });
    if (!result.count)
      throw httpError(HttpStatus.NOT_FOUND, this.notFoundMessage);
  }

  async removeByJournal(journalId: string): Promise<void> {
    await this.model.deleteMany({ where: { journal_id: journalId } });
  }
}
