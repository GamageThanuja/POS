import { describe, expect, it } from "vitest";
import { parseDecimal, toRatio } from "./decimal";

describe("decimal", () => {
  it("parses decimal strings exactly", () => {
    expect(parseDecimal("1.250")).toEqual({ num: 1250n, den: 1000n });
    expect(parseDecimal("-0.5")).toEqual({ num: -5n, den: 10n });
    expect(parseDecimal("+7")).toEqual({ num: 7n, den: 1n });
    expect(parseDecimal(" 12 ")).toEqual({ num: 12n, den: 1n });
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "1.", ".5", "1e3", "abc", "1,000", "--1"]) {
      expect(() => parseDecimal(bad)).toThrow(RangeError);
    }
  });

  it("converts every Numeric form", () => {
    expect(toRatio(3n)).toEqual({ num: 3n, den: 1n });
    expect(toRatio(4)).toEqual({ num: 4n, den: 1n });
    expect(toRatio("0.15")).toEqual({ num: 15n, den: 100n });
    expect(toRatio({ num: 1n, den: -3n })).toEqual({ num: -1n, den: 3n });
    expect(toRatio({ num: 2n, den: 5n })).toEqual({ num: 2n, den: 5n });
  });

  it("refuses floats and zero denominators", () => {
    expect(() => toRatio(0.1)).toThrow(/strings/);
    expect(() => toRatio(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => toRatio({ num: 1n, den: 0n })).toThrow(/zero/);
  });
});
