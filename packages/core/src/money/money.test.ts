import { describe, expect, it } from "vitest";
import {
  CurrencyMismatchError,
  absolute,
  add,
  allocate,
  allocateEvenly,
  compare,
  divide,
  equals,
  format,
  fromDecimal,
  fromJSON,
  isNegative,
  isPositive,
  isZero,
  max,
  min,
  money,
  multiply,
  negate,
  percentage,
  roundToIncrement,
  subtract,
  sum,
  toDecimal,
  toJSON,
  zero,
} from "./money";
import { RoundingMode } from "./rounding";

const HU = RoundingMode.HALF_UP;
const HE = RoundingMode.HALF_EVEN;
const lkr = (minor: bigint | number) => money(minor, "LKR");
const amounts = (ms: { amount: bigint }[]) => ms.map((m) => m.amount);

describe("construction", () => {
  it("stores bigint minor units and is frozen", () => {
    const m = lkr(12345);
    expect(m.amount).toBe(12345n);
    expect(m.currency).toBe("LKR");
    expect(Object.isFrozen(m)).toBe(true);
  });

  it("rejects non-integer numbers and unknown currencies", () => {
    expect(() => lkr(1.5)).toThrow(RangeError);
    expect(() => money(1n, "XXX")).toThrow(/Unsupported/);
  });

  it("zero()", () => {
    expect(zero("USD")).toEqual(money(0n, "USD"));
  });
});

describe("decimal conversion", () => {
  it("parses major units", () => {
    expect(fromDecimal("1250.50", "LKR", HU).amount).toBe(125050n);
    expect(fromDecimal("-0.05", "LKR", HU).amount).toBe(-5n);
    expect(fromDecimal("100", "JPY", HU).amount).toBe(100n);
    expect(fromDecimal("1.2345", "KWD", HU).amount).toBe(1235n);
  });

  it("rounds excess precision with the given mode", () => {
    expect(fromDecimal("0.125", "LKR", HU).amount).toBe(13n);
    expect(fromDecimal("0.125", "LKR", HE).amount).toBe(12n);
    expect(fromDecimal("-0.125", "LKR", HU).amount).toBe(-13n);
  });

  it("formats minor units back to decimal strings", () => {
    expect(toDecimal(lkr(125050))).toBe("1250.50");
    expect(toDecimal(lkr(5))).toBe("0.05");
    expect(toDecimal(lkr(-5))).toBe("-0.05");
    expect(toDecimal(lkr(0))).toBe("0.00");
    expect(toDecimal(money(42, "JPY"))).toBe("42");
    expect(toDecimal(money(1235, "KWD"))).toBe("1.235");
  });

  it("round-trips huge values without precision loss", () => {
    const s = "123456789012345678901234.56";
    expect(toDecimal(fromDecimal(s, "LKR", HU))).toBe(s);
  });

  it("formats for display", () => {
    expect(format(lkr(125050), "en-US")).toMatch(/1,250\.50/);
    expect(format(money(10, "JPY"), "en-US")).toMatch(/10/);
    expect(format(lkr(125050))).toMatch(/1,250\.50/);
  });
});

describe("arithmetic", () => {
  it("adds and subtracts", () => {
    expect(add(lkr(100), lkr(250), lkr(-50)).amount).toBe(300n);
    expect(subtract(lkr(100), lkr(250)).amount).toBe(-150n);
    expect(sum([lkr(1), lkr(2), lkr(3)], "LKR").amount).toBe(6n);
    expect(sum([], "LKR").amount).toBe(0n);
  });

  it("refuses to mix currencies", () => {
    expect(() => add(lkr(1), money(1, "USD"))).toThrow(CurrencyMismatchError);
    expect(() => subtract(lkr(1), money(1, "USD"))).toThrow(CurrencyMismatchError);
    expect(() => compare(lkr(1), money(1, "USD"))).toThrow(CurrencyMismatchError);
  });

  it("negates and takes absolute values", () => {
    expect(negate(lkr(5)).amount).toBe(-5n);
    expect(absolute(lkr(-5)).amount).toBe(5n);
    expect(absolute(lkr(5)).amount).toBe(5n);
  });

  it("compares", () => {
    expect(compare(lkr(1), lkr(2))).toBe(-1);
    expect(compare(lkr(2), lkr(1))).toBe(1);
    expect(compare(lkr(2), lkr(2))).toBe(0);
    expect(equals(lkr(2), lkr(2))).toBe(true);
    expect(equals(lkr(2), money(2, "USD"))).toBe(false);
    expect(min(lkr(1), lkr(2)).amount).toBe(1n);
    expect(min(lkr(3), lkr(2)).amount).toBe(2n);
    expect(max(lkr(1), lkr(2)).amount).toBe(2n);
    expect(max(lkr(3), lkr(2)).amount).toBe(3n);
    expect(isZero(lkr(0))).toBe(true);
    expect(isNegative(lkr(-1))).toBe(true);
    expect(isPositive(lkr(1))).toBe(true);
    expect(isPositive(lkr(0))).toBe(false);
  });

  it("multiplies by exact quantities", () => {
    // 3 × LKR 450.00
    expect(multiply(lkr(45000), 3, HU).amount).toBe(135000n);
    // 1.250 kg × LKR 1,199.99 = 1499.9875 → 1499.99
    expect(multiply(lkr(119999), "1.250", HU).amount).toBe(149999n);
    expect(multiply(lkr(100), 2n, HU).amount).toBe(200n);
    expect(multiply(lkr(1), { num: 1n, den: 3n }, RoundingMode.DOWN).amount).toBe(0n);
  });

  it("refuses float factors", () => {
    expect(() => multiply(lkr(100), 1.1, HU)).toThrow(/strings/);
  });

  it("divides", () => {
    expect(divide(lkr(1000), 3, HU).amount).toBe(333n);
    expect(divide(lkr(1000), 3, RoundingMode.UP).amount).toBe(334n);
    expect(divide(lkr(1000), "0.5", HU).amount).toBe(2000n);
    expect(() => divide(lkr(1000), 0, HU)).toThrow(/Division by zero/);
  });

  it("takes percentages", () => {
    expect(percentage(lkr(100000), "10", HU).amount).toBe(10000n);
    // 12.5% of LKR 9.99 = 1.24875 → 1.25 (HALF_UP) / 1.25 (HALF_EVEN)
    expect(percentage(lkr(999), "12.5", HU).amount).toBe(125n);
    // 15% of LKR 0.50 = 0.075 → 0.08 (HALF_UP) vs 0.08 (HALF_EVEN, 7.5 → 8)
    expect(percentage(lkr(50), "15", HE).amount).toBe(8n);
    // 5% of LKR 0.50 = 0.025 → 0.03 (HALF_UP) vs 0.02 (HALF_EVEN)
    expect(percentage(lkr(50), "5", HU).amount).toBe(3n);
    expect(percentage(lkr(50), "5", HE).amount).toBe(2n);
  });
});

describe("allocate", () => {
  it("splits exactly and gives remainders to the largest fractions", () => {
    const parts = allocate(lkr(1000), [1, 1, 1]);
    expect(amounts(parts)).toEqual([334n, 333n, 333n]);
    expect(sum(parts, "LKR").amount).toBe(1000n);
  });

  it("uses largest remainder, not position, for unequal ratios", () => {
    // 100 × [0.3, 0.7] ; 101 × 0.3 = 30.3, 101 × 0.7 = 70.7 → [30, 71]
    expect(amounts(allocate(lkr(101), ["0.3", "0.7"]))).toEqual([30n, 71n]);
  });

  it("handles mixed ratio forms and zero weights", () => {
    expect(amounts(allocate(lkr(100), [0, "1.5", { num: 1n, den: 2n }]))).toEqual([0n, 75n, 25n]);
  });

  it("allocates negative amounts symmetrically", () => {
    expect(amounts(allocate(lkr(-1000), [1, 1, 1]))).toEqual([-334n, -333n, -333n]);
  });

  it("validates ratios", () => {
    expect(() => allocate(lkr(1), [])).toThrow(/at least one/);
    expect(() => allocate(lkr(1), [-1, 2])).toThrow(/non-negative/);
    expect(() => allocate(lkr(1), [0, 0])).toThrow(/all be zero/);
  });

  it("evenly splits a bill", () => {
    const parts = allocateEvenly(lkr(10001), 4);
    expect(amounts(parts)).toEqual([2501n, 2500n, 2500n, 2500n]);
    expect(() => allocateEvenly(lkr(1), 0)).toThrow(RangeError);
    expect(() => allocateEvenly(lkr(1), 1.5)).toThrow(RangeError);
  });

  it("property: parts always sum to the original", () => {
    let seed = 42;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % n;
    };
    for (let k = 0; k < 500; k++) {
      const total = lkr(rand(2_000_000) - 1_000_000);
      const ratios = Array.from({ length: 1 + rand(8) }, () => rand(1000) + 1);
      expect(sum(allocate(total, ratios), "LKR").amount).toBe(total.amount);
    }
  });
});

describe("roundToIncrement (cash rounding)", () => {
  it("rounds to the nearest increment with the given mode", () => {
    expect(roundToIncrement(lkr(12349), 100n, HU).amount).toBe(12300n);
    expect(roundToIncrement(lkr(12350), 100n, HU).amount).toBe(12400n);
    expect(roundToIncrement(lkr(12350), 100n, HE).amount).toBe(12400n);
    expect(roundToIncrement(lkr(12250), 100n, HE).amount).toBe(12200n);
    expect(roundToIncrement(lkr(12310), 50n, RoundingMode.DOWN).amount).toBe(12300n);
  });

  it("rejects non-positive increments", () => {
    expect(() => roundToIncrement(lkr(1), 0n, HU)).toThrow(RangeError);
  });
});

describe("JSON", () => {
  it("serialises amounts as strings and parses them back", () => {
    const m = lkr(10n ** 20n);
    const json = toJSON(m);
    expect(json).toEqual({ amount: "100000000000000000000", currency: "LKR" });
    expect(equals(fromJSON(json), m)).toBe(true);
    expect(fromJSON({ amount: 5, currency: "LKR" }).amount).toBe(5n);
  });

  it("rejects malformed amounts", () => {
    expect(() => fromJSON({ amount: "1.5", currency: "LKR" })).toThrow(RangeError);
  });
});
