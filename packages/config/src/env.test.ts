import { describe, expect, it } from "vitest";
import { EnvValidationError, clientEnvSchema, parseEnv, serverEnvSchema } from "./env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
  SUPABASE_SECRET_KEY: "sb_secret_super_sensitive",
  DATABASE_URL: "postgresql://u:p@h:6543/postgres",
  DIRECT_DATABASE_URL: "postgresql://u:p@h:5432/postgres",
  APP_URL: "http://localhost:3000",
  APP_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
};

describe("env", () => {
  it("parses a complete server env and applies defaults", () => {
    const env = parseEnv(serverEnvSchema, valid);
    expect(env.DEFAULT_CURRENCY).toBe("LKR");
    expect(env.DEFAULT_TIMEZONE).toBe("Asia/Colombo");
    expect(env.EMAIL_DRIVER).toBe("console");
    expect(env.SMTP_HOST).toBeUndefined();
  });

  it("fails fast listing missing keys without leaking values", () => {
    const { SUPABASE_SECRET_KEY: _s, DATABASE_URL: _d, ...rest } = valid;
    try {
      parseEnv(serverEnvSchema, { ...rest, APP_ENCRYPTION_KEY: "short-secret-value" });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(EnvValidationError);
      const msg = (e as Error).message;
      expect(msg).toContain("SUPABASE_SECRET_KEY");
      expect(msg).toContain("DATABASE_URL");
      expect(msg).toContain("APP_ENCRYPTION_KEY");
      expect(msg).not.toContain("short-secret-value");
    }
  });

  it("client schema exposes only public keys", () => {
    const env = parseEnv(clientEnvSchema, valid);
    expect(Object.keys(env).every((k) => k.startsWith("NEXT_PUBLIC_"))).toBe(true);
  });
});
