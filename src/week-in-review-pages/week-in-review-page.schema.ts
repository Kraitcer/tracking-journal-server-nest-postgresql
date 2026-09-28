import Joi from 'joi';
export const WEEK_IN_REVIEW_PAGE_MODEL = 'weekInReviewPage';

export const weekInReviewPageJoiSchema = Joi.object({
  _id: Joi.string().required(),
  user_id: Joi.string().required(),
  journal_id: Joi.string().optional().allow(''),
  pageDate: Joi.string().optional().allow(''),
  isEditing: Joi.string().valid('editing', 'finalized').optional(),
  layouts: Joi.object({
    good_habits: Joi.string()
      .valid('simplification', 'simplify one good habit')
      .required(),
    bad_habits: Joi.string()
      .valid('complication', 'complicate one bad habit')
      .required(),
  }).optional(),
  projects: Joi.array()
    .items(
      Joi.object({
        project_id: Joi.string().required(),
        done: Joi.number().required(),
      }),
    )
    .optional(),
  habits: Joi.array()
    .items(
      Joi.object({
        habit_id: Joi.string().required(),
        details: Joi.string().optional().allow(''),
        detailsType: Joi.string()
          .valid('simplification', 'complication')
          .optional(),
      }),
    )
    .optional(),
  moreOrLess: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        do: Joi.string().valid('more', 'less').required(),
        toDoWhat: Joi.string().optional().allow(''),
      }),
    )
    .optional(),
});
