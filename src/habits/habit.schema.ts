import Joi from 'joi';
export const HABIT_MODEL = 'habit';

export const habitJoiSchema = Joi.object({
  _id: Joi.string().optional().allow(''),
  user_id: Joi.string().optional().allow(''),
  name: Joi.string().optional().allow(''),
  type: Joi.string().valid('health', 'emotions', 'intellect').optional(),
  direction: Joi.string().valid('bad', 'good').optional(),
  status: Joi.string().valid('established', 'building', 'desired').optional(),
});
