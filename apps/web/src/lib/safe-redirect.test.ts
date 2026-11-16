import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeNextPath("/finance?tab=gl")).toBe("/finance?tab=gl");
  });

  it("rejects external or malformed targets", () => {
    for (const bad of [
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "finance",
      undefined,
      42,
    ]) {
      expect(safeNextPath(bad)).toBe("/dashboard");
    }
  });
});
