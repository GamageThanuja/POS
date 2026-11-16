import { describe, expect, it } from "vitest";
import { idTimestamp, isUuidV7, newId } from "./index";

describe("ids", () => {
  it("generates valid, unique, time-ordered UUIDv7s", () => {
    const ids = Array.from({ length: 1000 }, newId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(isUuidV7)).toBe(true);
    expect([...ids].sort()).toEqual(ids);
  });

  it("rejects non-v7 values", () => {
    expect(isUuidV7("9b2c1c3e-4a5b-4c6d-8e7f-0a1b2c3d4e5f")).toBe(false); // v4
    expect(isUuidV7("not-a-uuid")).toBe(false);
    expect(isUuidV7(42)).toBe(false);
  });

  it("extracts the creation timestamp", () => {
    const before = Date.now();
    const ts = idTimestamp(newId()).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(Date.now());
    expect(() => idTimestamp("nope")).toThrow(RangeError);
  });
});
