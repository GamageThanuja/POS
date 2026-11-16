import { z } from "zod";

/**
 * Environment contract. `clientEnvSchema` may only hold `NEXT_PUBLIC_*` values,
 * because those are inlined into the browser bundle. Everything secret lives in
 * `serverEnvSchema` and must only be parsed in server code.
 */

const nonEmpty = z.string().trim().min(1);
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: nonEmpty,
});

const postgresUrl = z
  .string()
  .trim()
  .regex(/^postgres(ql)?:\/\//, "must be a postgres:// or postgresql:// URL");

export const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  SUPABASE_SECRET_KEY: nonEmpty,
  DATABASE_URL: postgresUrl,
  DIRECT_DATABASE_URL: postgresUrl,

  APP_URL: z.url(),
  APP_ENCRYPTION_KEY: nonEmpty.refine(
    (v) => {
      try {
        return Buffer.from(v, "base64").length === 32;
      } catch {
        return false;
      }
    },
    { message: "must be 32 bytes, base64-encoded (openssl rand -base64 32)" },
  ),
  DEFAULT_TIMEZONE: nonEmpty.default("Asia/Colombo"),
  DEFAULT_CURRENCY: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default("LKR"),

  GOTENBERG_URL: z.url().default("http://localhost:3001"),

  EMAIL_DRIVER: z.enum(["console", "smtp", "resend"]).default("console"),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: nonEmpty.default("POS <no-reply@example.com>"),

  SMS_DRIVER: z.enum(["console", "http", "twilio"]).default("console"),
  SMS_HTTP_URL: optionalString,
  SMS_HTTP_API_KEY: optionalString,
  SMS_SENDER_ID: optionalString,
  TWILIO_ACCOUNT_SID: optionalString,
  TWILIO_AUTH_TOKEN: optionalString,
  TWILIO_FROM: optionalString,

  SENTRY_DSN: optionalString,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvValidationError extends Error {
  constructor(public readonly issues: { key: string; message: string }[]) {
    super(
      "Invalid or missing environment variables:\n" +
        issues.map((i) => `  - ${i.key}: ${i.message}`).join("\n") +
        "\nCopy .env.example to .env.local at the repo root and fill it in.",
    );
    this.name = "EnvValidationError";
  }
}

/** Parses `source` against `schema`. Error messages name keys only, never values. */
export function parseEnv<S extends z.ZodType>(
  schema: S,
  source: Record<string, string | undefined>,
): z.infer<S> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new EnvValidationError(
      result.error.issues.map((i) => ({
        key: i.path.join(".") || "(root)",
        message: i.message,
      })),
    );
  }
  return result.data;
}

let cachedServerEnv: ServerEnv | undefined;

/** Validated server environment (memoised). Fails fast on first call if invalid. */
export function serverEnv(): ServerEnv {
  cachedServerEnv ??= parseEnv(serverEnvSchema, process.env);
  return cachedServerEnv;
}

/** Subset needed by database tooling (migrate/seed/worker) without web-only keys. */
export const dbEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: postgresUrl,
  DIRECT_DATABASE_URL: postgresUrl,
});
export type DbEnv = z.infer<typeof dbEnvSchema>;
