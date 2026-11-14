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
}).unknown(true);
