import { HttpStatus, Injectable } from '@nestjs/common';
import { type Body, httpError, joiValidate, toPlain } from '../common/http.js';
import { PrismaService } from '../database/prisma.service.js';
import { deleteImagesReferencedBy } from '../uploads/upload-files.js';
import {
  createDescriptionJoiSchema,
  entityQueryJoiSchema,
  updateDescriptionJoiSchema,
} from './description.schema.js';

function toResponse(doc: unknown): Body {
  const plain = toPlain(doc);
  return { id: plain.id, ...plain, _id: plain.id };
}

function entityFilter(query: Body): Body {
  const { entity_id, entity } = query;
  joiValidate(entityQueryJoiSchema, { entity_id, entity });
  return { entity, entity_id };
}

@Injectable()
export class DescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEntity(query: Body) {
    const descriptions = await this.prisma.description.findMany({
      where: entityFilter(query),
    });
    return descriptions.map(toResponse);
  }

  async create(body: Body) {
    const { _id, id, for: forEntity, body: content } = body;
    const payload = { id: _id || id, for: forEntity, body: content };
    joiValidate(createDescriptionJoiSchema, payload);

    const description = await this.prisma.description.upsert({
      where: {
        entity_entity_id: {
          entity: payload.for.entity,
          entity_id: payload.for.entity_id,
        },
      },
      update: {},
      create: {
        ...(payload.id ? { id: payload.id } : {}),
        entity: payload.for.entity,
        entity_id: payload.for.entity_id,
        body: payload.body,
      },
    });
    return toResponse(description);
  }

  async update(id: string, body: Body) {
    joiValidate(updateDescriptionJoiSchema, body);
    const data: Body = {};
    if (body.for?.entity !== undefined) data.entity = body.for.entity;
    if (body.for?.entity_id !== undefined) data.entity_id = body.for.entity_id;
    if (body.body !== undefined) data.body = body.body;
    const result = await this.prisma.description.updateMany({
      where: { id },
      data,
    });
    if (!result.count) {
      throw httpError(HttpStatus.NOT_FOUND, 'Description not found');
    }
    const description = await this.prisma.description.findUnique({
      where: { id },
    });
    return toResponse(description);
  }

  async removeByEntity(query: Body) {
    const filter = entityFilter(query);
    const toDelete = await this.prisma.description.findMany({ where: filter });
    await deleteImagesReferencedBy(toDelete.map((d) => d.body));
    const result = await this.prisma.description.deleteMany({ where: filter });
    return { deletedCount: result.count };
  }

  async remove(id: string) {
    const description = await this.prisma.description.findUnique({
      where: { id },
    });
    if (!description) {
      throw httpError(HttpStatus.NOT_FOUND, 'Description not found');
    }
    await deleteImagesReferencedBy([description.body]);
    await this.prisma.description.delete({ where: { id } });
    return toResponse(description);
  }
}
