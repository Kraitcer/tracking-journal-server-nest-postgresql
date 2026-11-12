import Joi from 'joi';
export const GOAL_MODEL = 'goal';

const smartCriterion = (conclusion: string, suggestions: string) =>
  Joi.object({
    status: Joi.string().valid('newGoal', 'corresponds').required(),
    definition: Joi.string().allow('').required(),
    [conclusion]: Joi.string().allow('', null).required(),
    [suggestions]: Joi.array()
      .items(Joi.string().allow(''))
      .allow(null)
      .required(),
  }).required();

export const smartServeyJoiSchema = Joi.object({
  specific: smartCriterion('currentNameConclusion', 'proposedNames'),
  mesurable: smartCriterion('currentGoalConclusion', 'proposedMeasures'),
  actionable: smartCriterion('currentGoalConclusion', 'proposedActions'),
  resonable: smartCriterion('currentGoalConclusion', 'proposedReasons'),
  timeBound: smartCriterion('currentGoalConclusion', 'proposedTimeFrames'),
});

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
  smart: smartServeyJoiSchema,
});
