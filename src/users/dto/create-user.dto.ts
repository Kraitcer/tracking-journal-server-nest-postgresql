import Joi from 'joi';

export const createUserSchema = Joi.object({
  _id: Joi.string().allow(''),
  firstName: Joi.string().min(1).max(50).allow(''),
  lastName: Joi.string().min(1).max(50).allow(''),
  profileName: Joi.string().min(3).max(50).allow(''),
  password: Joi.string().min(5).max(255).allow(''),
  email: Joi.string().min(3).max(255).required().email(),
  isActive: Joi.boolean(),
  authProvider: Joi.string().valid('local', 'google'),
  googleId: Joi.string().allow(''),
});

export const loginSchema = Joi.object({
  email: Joi.string().min(3).max(255).required().email(),
  password: Joi.string().required(),
});

export const googleLoginSchema = Joi.object({
  idToken: Joi.string().required(),
});
