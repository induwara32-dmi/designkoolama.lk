import Joi from "joi";

export const environmentSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().port().default(4000),
  FRONTEND_URL: Joi.string().uri().required(),
  SWAGGER_ENABLED: Joi.boolean().default(false),
  DATABASE_URL: Joi.string().uri().required(),
  ADMIN_ACCESS_TOKEN_SECRET: Joi.string().min(32).when("NODE_ENV", { is: "production", then: Joi.required(), otherwise: Joi.optional() }),
  ADMIN_REFRESH_TOKEN_SECRET: Joi.string().min(32).when("NODE_ENV", { is: "production", then: Joi.required(), otherwise: Joi.optional() }),
  ADMIN_ACCESS_TOKEN_TTL_SECONDS: Joi.number().integer().min(60).default(900),
  ADMIN_REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).default(7),
  ADMIN_COOKIE_SECURE: Joi.boolean().when("NODE_ENV", { is: "production", then: Joi.valid(true).required(), otherwise: Joi.boolean().default(false) }),
  ADMIN_COOKIE_SAME_SITE: Joi.string().valid("strict", "lax", "none").default("lax"),
  ADMIN_COOKIE_DOMAIN: Joi.string().allow("").optional(),
  ADMIN_FRONTEND_URL: Joi.string().uri().when("NODE_ENV", { is: "production", then: Joi.required(), otherwise: Joi.optional() }),
  PASSWORD_RESET_TTL_MINUTES: Joi.number().integer().min(5).default(30),
  PASSWORD_RESET_FRONTEND_URL: Joi.string().uri().when("NODE_ENV", { is: "production", then: Joi.required(), otherwise: Joi.optional() }),
  AUTH_DEV_RESET_PROVIDER: Joi.boolean().when("NODE_ENV", { is: "production", then: Joi.valid(false).default(false), otherwise: Joi.boolean().default(false) }),
  CONTENT_PREVIEW_SECRET: Joi.string().min(32).when("NODE_ENV", { is: "production", then: Joi.required(), otherwise: Joi.optional() }),
  CONTENT_PREVIEW_TTL_SECONDS: Joi.number().integer().min(60).max(3600).default(900),
  CLOUDINARY_CLOUD_NAME: Joi.string().trim().optional(),
  CLOUDINARY_API_KEY: Joi.string().trim().optional(),
  CLOUDINARY_API_SECRET: Joi.string().trim().optional(),
  CLOUDINARY_FOLDER: Joi.string().trim().pattern(/^[a-zA-Z0-9/_-]+$/).optional(),
  MEDIA_MAX_FILE_SIZE_MB: Joi.number().integer().min(1).max(25).default(10),
}).custom((value: Record<string, unknown>, helpers) => {
  if (value.NODE_ENV !== "production") return value;
  for (const key of ["FRONTEND_URL", "ADMIN_FRONTEND_URL", "PASSWORD_RESET_FRONTEND_URL"] as const) {
    const candidate = value[key];
    if (typeof candidate !== "string" || !candidate.startsWith("https://")) {
      // helpers.error("any.invalid", { key }) was silently useless here: this
      // .custom() runs on the whole object, not a per-field schema, so Joi's
      // default "any.invalid" template renders with the OBJECT's own label
      // ("value") instead of the field name -- the { key } context was passed but
      // never referenced by that template, producing the exact unhelpful
      // "'value' contains an invalid value" error this was found from. A literal
      // message naming the real field and its actual (non-secret) value replaces
      // that generic template entirely.
      return helpers.message({
        custom: `"${key}" must start with "https://" once NODE_ENV is "production" (got: ${JSON.stringify(candidate)})`,
      });
    }
  }
  return value;
}, "production transport security");
