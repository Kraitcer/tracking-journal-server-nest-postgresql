import Joi from 'joi';
export const PLANNING_NEXT_WEEK_PAGE_MODEL = 'planningNextWeekPage';

export const planningNextWeekPageJoiSchema = Joi.object({
  _id: Joi.string().required(),
  user_id: Joi.string().required(),
  journal_id: Joi.string().optional().allow(''),
  pageDate: Joi.string().optional().allow(''),
  isEditing: Joi.string().valid('editing', 'finalized').optional(),
  layouts: Joi.object({
    good_habits: Joi.string()
      .valid('triggers', 'trigger one good habit')
      .required(),
    bad_habits: Joi.string()
      .valid('blockers', 'block one bad habit')
      .required(),
  }).optional(),
  habits: Joi.array()
    .items(
      Joi.object({
        habit_id: Joi.string().required(),
        detailsType: Joi.string().valid('trigger', 'blocker').required(),
        details: Joi.string().optional().allow(''),
      }),
    )
    .optional(),
  projects: Joi.array()
    .items(
      Joi.object({
        project_id: Joi.string().required(),
        FETUSIndex: Joi.object({
          FETUS: Joi.number().optional(),
          fun: Joi.number().optional(),
          effect: Joi.number().optional(),
          time: Joi.number().optional(),
          urgency: Joi.number().optional(),
          strategy: Joi.number().optional(),
          bonus: Joi.number().optional(),
          total: Joi.number().optional(),
        }).optional(),
      }),
    )
    .optional(),
});
