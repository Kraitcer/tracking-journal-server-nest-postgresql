import Joi from 'joi';
export const DESCRIPTION_MODEL = 'descriptions';

const ENTITIES = ['project', 'goal', 'task', 'subTask', 'habit'];

const bodyItems = Joi.array()
  .items(Joi.object({ type: Joi.string().required() }).unknown(true))
  .required();

export const createDescriptionJoiSchema = Joi.object({
  _id: Joi.string(),
  for: Joi.object({
    entity: Joi.string()
      .valid(...ENTITIES)
      .required(),
    entity_id: Joi.string().required(),
  }).required(),
  body: bodyItems,
});

export const updateDescriptionJoiSchema = Joi.object({
  for: Joi.object({
    entity: Joi.string().valid(...ENTITIES),
    entity_id: Joi.string(),
  }),
  body: bodyItems,
});

export const entityQueryJoiSchema = Joi.object({
  entity_id: Joi.string().required(),
  entity: Joi.string()
    .valid(...ENTITIES)
    .required(),
});
