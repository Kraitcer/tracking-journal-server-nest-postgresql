import { Injectable, type PipeTransform } from '@nestjs/common';
import type Joi from 'joi';
import { joiValidate, type Body } from './http.js';

@Injectable()
export class JoiValidationPipe implements PipeTransform<unknown, Body> {
  constructor(private readonly schema: Joi.Schema) {}

  transform(value: unknown): Body {
    return joiValidate(this.schema, value);
  }
}
