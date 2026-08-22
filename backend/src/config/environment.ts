import Joi from "joi";

export const environmentSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().port().default(4000),
  FRONTEND_URL: Joi.string().uri().required(),
  DATABASE_URL: Joi.string().uri().required(),
  ADMIN_ACCESS_TOKEN_SECRET: Joi.string().min(32).when("NODE_ENV", { is: "production", then: Joi.required(), otherwise: Joi.optional() }),
  ADMIN_REFRESH_TOKEN_SECRET: Joi.string().min(32).when("NODE_ENV", { is: "production", then: Joi.required(), otherwise: Joi.optional() }),
  ADMIN_ACCESS_TOKEN_TTL_SECONDS: Joi.number().integer().min(60).default(900),
  ADMIN_REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).default(7),
  ADMIN_COOKIE_SECURE: Joi.boolean().default(false),
  ADMIN_COOKIE_SAME_SITE: Joi.string().valid("strict", "lax", "none").default("lax"),
  ADMIN_COOKIE_DOMAIN: Joi.string().allow("").optional(),
  ADMIN_FRONTEND_URL: Joi.string().uri().when("NODE_ENV", { is: "production", then: Joi.required(), otherwise: Joi.optional() }),
  PASSWORD_RESET_TTL_MINUTES: Joi.number().integer().min(5).default(30),
  PASSWORD_RESET_FRONTEND_URL: Joi.string().uri().when("NODE_ENV", { is: "production", then: Joi.required(), otherwise: Joi.optional() }),
  AUTH_DEV_RESET_PROVIDER: Joi.boolean().default(false),
});
