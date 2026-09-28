import { HttpException, HttpStatus } from '@nestjs/common';
import type Joi from 'joi';

export type Body = Record<string, any>;

export function httpError(
  status: HttpStatus,
  message: string | Record<string, unknown>,
): HttpException {
  return new HttpException(message, status);
}

export function joiValidate(schema: Joi.Schema, value: unknown): void {
  let payload = value;
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'id' in payload &&
    !('_id' in payload)
  ) {
    const { id, ...rest } = payload as Body;
    payload = { ...rest, _id: id };
  }
  const { error } = schema.validate(payload);
  if (error) {
    throw httpError(HttpStatus.BAD_REQUEST, error.details[0].message);
  }
}

export function withoutUndefined(body: Body | undefined): Body {
  return Object.fromEntries(
    Object.entries(body ?? {}).filter(([, value]) => value !== undefined),
  );
}

export function toPlain(doc: any): Body {
  return doc;
}

export function withIdField(doc: any): Body {
  const { id, _id, ...rest } = toPlain(doc);
  return { id: id ?? _id, ...rest };
}

export function modelFromBody(body: Body | undefined): Body {
  const { id, _id, ...rest } = body ?? {};
  return { id: id ?? _id, ...rest };
}
