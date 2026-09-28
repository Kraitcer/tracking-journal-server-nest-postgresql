import Joi from 'joi';
export const MORNING_PAGE_MODEL = 'morningPage';

export const morningPageJoiSchema = Joi.object({
  _id: Joi.string().optional().allow(''),
  user_id: Joi.string().optional().allow(''),
  journal_id: Joi.string().optional().allow(''),
  pageDate: Joi.string().optional().allow(''),
  display: Joi.string().optional().allow(''),
  finalized: Joi.boolean().optional(),
  selectedProject: Joi.string().optional().allow(''),
  selectedGoal: Joi.string().optional().allow(''),
  wakeUpTime: Joi.string().optional().allow(''),
  wokeUpEnergized: Joi.boolean().optional(),
  hungryForAction: Joi.boolean().optional(),
  sleeprRating: Joi.number().integer().min(1).max(5).required(),
  todayProjectsAndGoals: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().optional().allow(''),
        goals: Joi.array().items(Joi.string()).optional(),
      }),
    )
    .optional()
    .default([]),
});
