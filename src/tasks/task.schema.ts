import Joi from 'joi';
export const TASK_MODEL = 'task';

export const taskJoiSchema = Joi.object({
  _id: Joi.string().allow(''),
  id: Joi.string().allow(''),
  taskName: Joi.string().allow(''),
  goal_id: Joi.string().allow(''),
  project_id: Joi.string().allow(''),
  description: Joi.string().allow(''),
  isEditing: Joi.boolean(),
  completed: Joi.boolean(),
});
