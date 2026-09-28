import Joi from 'joi';
export const PROJECT_MODEL = 'projects';
export const FETUS_MODEL = 'FETUSes';

export const projectJoiSchema = Joi.object({
  _id: Joi.string().min(3).required(),
  user_id: Joi.string().allow(''),
  projectName: Joi.string().allow(''),
  date_created: Joi.string(),
  description: Joi.string().allow(''),
  completed: Joi.boolean(),
  priority: Joi.number(),
  fetusIndex: Joi.object({
    fun: Joi.number().max(10),
    effect: Joi.number().max(10),
    time: Joi.number().max(10),
    urgency: Joi.number().max(10),
    strategy: Joi.number().max(10),
    bonus: Joi.number().min(3).max(5),
    total: Joi.number().max(100).required(),
  }),
});

export const fetusJoiSchema = Joi.object({
  projectID: Joi.string().required(),
  fetusIndex: Joi.object({
    fun: Joi.number().max(10),
    effect: Joi.number().max(10),
    time: Joi.number().max(10),
    urgency: Joi.number().max(10),
    strategy: Joi.number().max(10),
    bonus: Joi.number().min(0).max(5),
    total: Joi.number().max(100).required(),
  }),
});
