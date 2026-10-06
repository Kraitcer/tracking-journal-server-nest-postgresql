import { HttpException, HttpStatus, SetMetadata } from '@nestjs/common';
import type Joi from 'joi';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export type Body = Record<string, any>;

export function httpError(
  status: HttpStatus,
  message: string | Record<string, unknown>,
): HttpException {
  return new HttpException(message, status);
}

export function joiValidate(schema: Joi.Schema, value: unknown): Body {
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
  const { error, value: validated } = schema.validate(payload);
  if (error) {
    throw httpError(HttpStatus.BAD_REQUEST, error.details[0].message);
  }
  return validated as Body;
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
