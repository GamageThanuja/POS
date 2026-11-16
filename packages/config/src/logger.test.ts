import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger } from "./logger";

function capture() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      lines.push(chunk.toString());
      cb();
    },
  });
  return { lines, stream };
}

describe("logger", () => {
  it("redacts secrets at top level and nested, keeps other fields", () => {
    const { lines, stream } = capture();
    const log = createLogger({ name: "test" }, stream);
    log.info(
      {
        password: "hunter2",
        user: { email: "a@b.c", token: "tok-123" },
        req: { headers: { authorization: "Bearer xyz" } },
        cfg: { SUPABASE_SECRET_KEY: "sb_secret_abc" },
      },
      "hello",
    );
    const out = lines.join("");
    expect(out).toContain("hello");
    expect(out).toContain("a@b.c");
    for (const secret of ["hunter2", "tok-123", "Bearer xyz", "sb_secret_abc"]) {
      expect(out).not.toContain(secret);
    }
    expect(out).toContain("[REDACTED]");
  });

  it("cannot be configured to turn redaction off", () => {
    const { lines, stream } = capture();
    createLogger({ name: "test", redact: [] }, stream).info({ apiKey: "k-1" });
    expect(lines.join("")).not.toContain("k-1");
  });
});
