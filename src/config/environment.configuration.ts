import Joi from 'joi';

export const environmentConfig = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  PORT: Joi.number().port().default(3000),

  DATABASE_URL: Joi.string()
    .uri({
      scheme: ['postgres', 'postgresql'],
    })
    .required(),

  REDIS_URL: Joi.string()
    .uri({
      scheme: ['redis'],
    })
    .required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  JWT_ACCESS_EXP: Joi.number().integer().positive().default(1800),
  JWT_REFRESH_EXP: Joi.number().integer().positive().default(1209600),
}).unknown(true);
