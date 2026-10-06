import Joi from 'joi';

export const createUserSchema = Joi.object({
  _id: Joi.string().max(100).allow(''),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  profileName: Joi.string().min(3).max(50).allow(''),
  password: Joi.string().min(8).max(255).required(),
  email: Joi.string().min(3).max(255).required().email(),
});

export const loginSchema = Joi.object({
  email: Joi.string().min(3).max(255).required().email(),
  password: Joi.string().required(),
});

export const googleLoginSchema = Joi.object({
  idToken: Joi.string().required(),
});
