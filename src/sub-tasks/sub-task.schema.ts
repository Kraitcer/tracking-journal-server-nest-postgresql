import Joi from 'joi';
export const SUB_TASK_MODEL = 'subTask';

export const subTaskJoiSchema = Joi.object({
  _id: Joi.string().allow(''),
  subTaskName: Joi.string().allow(''),
  task_id: Joi.string().allow(''),
  goal_id: Joi.string().allow(''),
  padMode: Joi.string().allow(''),
  project_id: Joi.string().allow(''),
  description: Joi.string().allow(''),
  completed: Joi.boolean(),
});
