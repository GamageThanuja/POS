import { describe, expect, it } from "vitest";
import { RoundingMode, divRound } from "./rounding";

const M = RoundingMode;
// [n, d, HALF_UP, HALF_DOWN, HALF_EVEN, UP, DOWN, CEILING, FLOOR]
const table: [bigint, bigint, ...bigint[]][] = [
  [25n, 10n, 3n, 2n, 2n, 3n, 2n, 3n, 2n],
  [35n, 10n, 4n, 3n, 4n, 4n, 3n, 4n, 3n],
  [-25n, 10n, -3n, -2n, -2n, -3n, -2n, -2n, -3n],
  [-35n, 10n, -4n, -3n, -4n, -4n, -3n, -3n, -4n],
  [21n, 10n, 2n, 2n, 2n, 3n, 2n, 3n, 2n],
  [29n, 10n, 3n, 3n, 3n, 3n, 2n, 3n, 2n],
  [-21n, 10n, -2n, -2n, -2n, -3n, -2n, -2n, -3n],
  [-29n, 10n, -3n, -3n, -3n, -3n, -2n, -2n, -3n],
  [20n, 10n, 2n, 2n, 2n, 2n, 2n, 2n, 2n],
  [0n, 7n, 0n, 0n, 0n, 0n, 0n, 0n, 0n],
  [5n, 10n, 1n, 0n, 0n, 1n, 0n, 1n, 0n],
  [15n, 10n, 2n, 1n, 2n, 2n, 1n, 2n, 1n],
];
const modes = [M.HALF_UP, M.HALF_DOWN, M.HALF_EVEN, M.UP, M.DOWN, M.CEILING, M.FLOOR];

describe("divRound", () => {
  for (const [n, d, ...expected] of table) {
    modes.forEach((mode, i) => {
      it(`${n}/${d} ${mode} = ${expected[i]}`, () => {
        expect(divRound(n, d, mode)).toBe(expected[i]);
      });
    });
  }

  it("handles negative divisors", () => {
    expect(divRound(25n, -10n, M.HALF_UP)).toBe(-3n);
    expect(divRound(-25n, -10n, M.HALF_EVEN)).toBe(2n);
  });

  it("rejects division by zero and unknown modes", () => {
    expect(() => divRound(1n, 0n, M.HALF_UP)).toThrow(RangeError);
    expect(() => divRound(1n, 3n, "BOGUS" as RoundingMode)).toThrow(/Unknown rounding mode/);
  });

  it("is exact for values far beyond Number.MAX_SAFE_INTEGER", () => {
    const big = 10n ** 30n + 5n;
    expect(divRound(big, 10n, M.HALF_UP)).toBe(10n ** 29n + 1n);
    expect(divRound(big, 10n, M.HALF_EVEN)).toBe(10n ** 29n);
  });
});
