import Joi from 'joi';
export const FREE_DAY_MODEL = 'freeDay';

export const freeDayJoiSchema = Joi.object({
  _id: Joi.string().required(),
  user_id: Joi.string().allow('').optional(),
  journal_id: Joi.string().allow('').optional(),
  pageDate: Joi.string().allow('').optional(),
  morningPages: Joi.string().allow('').optional(),
  eveningPages: Joi.string().allow('').optional(),
});
