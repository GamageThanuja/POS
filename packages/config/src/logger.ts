import pino, { type DestinationStream, type Logger, type LoggerOptions } from "pino";

/** Keys whose values are always replaced with "[REDACTED]" at any of the listed depths. */
export const SECRET_KEYS = [
  "password",
  "pin",
  "pinHash",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "set-cookie",
  "authToken",
  "privateKey",
  "credentials",
  "SUPABASE_SECRET_KEY",
  "APP_ENCRYPTION_KEY",
  "DATABASE_URL",
  "DIRECT_DATABASE_URL",
  "SMTP_PASSWORD",
  "RESEND_API_KEY",
  "SMS_HTTP_API_KEY",
  "TWILIO_AUTH_TOKEN",
] as const;

function redactPaths(): string[] {
  const paths: string[] = [];
  for (const key of SECRET_KEYS) {
    const k = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `["${key}"]`;
    const sep = k.startsWith("[") ? "" : ".";
    paths.push(k, `*${sep}${k}`, `*.*${sep}${k}`);
  }
  return paths;
}

/** Structured JSON logger. Secret-looking keys are always redacted (options cannot disable it). */
export function createLogger(options: LoggerOptions = {}, destination?: DestinationStream): Logger {
  const opts: LoggerOptions = {
    level: process.env.LOG_LEVEL ?? "info",
    base: { service: options.name ?? "pos" },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...options,
    redact: { paths: redactPaths(), censor: "[REDACTED]" },
  };
  return destination ? pino(opts, destination) : pino(opts);
}

export type { Logger };
