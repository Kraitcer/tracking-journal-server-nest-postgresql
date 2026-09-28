import Joi from 'joi';
export const GOAL_MODEL = 'goal';

export const goalJoiSchema = Joi.object({
  _id: Joi.string().allow(''),
  goalName: Joi.string().allow(''),
  currentProjectID: Joi.string().allow(''),
  description: Joi.string().allow(''),
  status: Joi.string(),
  padMode: Joi.string().allow(''),
  priority: Joi.number(),
  creationDate: Joi.string().allow(''),
  timeSpent: Joi.string().allow(''),
  dueDate: Joi.string().allow(''),
});
