import Joi from 'joi';
export const EVENING_PAGE_MODEL = 'eveningPages';

export const eveningPageJoiSchema = Joi.object({
  _id: Joi.string().optional().allow(''),
  journal_id: Joi.string().optional().allow(''),
  user_id: Joi.string().optional().allow(''),
  pageDate: Joi.string().optional().allow(''),
  layouts: Joi.object({
    goals: Joi.string().optional().allow(''),
    habits: Joi.string().optional().allow(''),
  }).optional(),
  isEditing: Joi.string().valid('editing', 'finalized').optional(),
  allGoals: Joi.array().optional(),
  createdAt: Joi.string().optional().allow(''),
  todayGoals: Joi.array()
    .items(
      Joi.object({
        goal_id: Joi.string().optional().allow(''),
        completionPercentage: Joi.number().optional(),
        name: Joi.string().optional().allow(''),
        scheduledStart: Joi.string().optional().allow(''),
        progress: Joi.number().optional(),
        status: Joi.string().valid('planned', 'spontaneous').optional(),
      }),
    )
    .optional(),
  todaysTasks: Joi.array().items(Joi.string()).optional(),
  gratefulness: Joi.array()
    .items(
      Joi.object({
        gratefulFor: Joi.string().required(),
        type: Joi.string().required(),
      }),
    )
    .optional(),
  voteCast: Joi.array()
    .items(
      Joi.object({
        habit_id: Joi.string().required(),
        improvement: Joi.string().required(),
        details: Joi.string().optional(),
      }),
    )
    .optional(),
  yourEngine: Joi.object({
    health: Joi.number().integer().min(1).max(5).required(),
    emotions: Joi.number().integer().min(1).max(5).required(),
    intellect: Joi.number().integer().min(1).max(5).required(),
  }).required(),
  badTime: Joi.string().optional().allow(''),
});
