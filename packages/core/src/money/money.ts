import { type CurrencyCode, currencyExponent } from "./currency";
import { type Numeric, type Ratio, parseDecimal, toRatio } from "./decimal";
import { type RoundingMode, divRound } from "./rounding";

/**
 * Money as integer minor units plus an ISO currency (CLAUDE.md rule 1).
 * Immutable; every operation returns a new value.
 */
export interface Money {
  readonly amount: bigint;
  readonly currency: CurrencyCode;
}

export class CurrencyMismatchError extends Error {
  constructor(a: CurrencyCode, b: CurrencyCode) {
    super(`Currency mismatch: ${a} vs ${b}`);
    this.name = "CurrencyMismatchError";
  }
}

/** Creates money from minor units. Numbers must be safe integers. */
export function money(amountMinor: bigint | number, currency: CurrencyCode): Money {
  currencyExponent(currency); // validates the code
  if (typeof amountMinor === "number" && !Number.isSafeInteger(amountMinor)) {
    throw new RangeError(`Minor units must be a safe integer, got ${amountMinor}`);
  }
  return Object.freeze({ amount: BigInt(amountMinor), currency });
}

export function zero(currency: CurrencyCode): Money {
  return money(0n, currency);
}

/**
 * Parses a major-unit decimal string ("1250.50") into money. Extra precision
 * beyond the currency's minor unit is rounded with `mode`.
 */
export function fromDecimal(value: string, currency: CurrencyCode, mode: RoundingMode): Money {
  const exp = currencyExponent(currency);
  const r = parseDecimal(value);
  return money(divRound(r.num * 10n ** BigInt(exp), r.den, mode), currency);
}

/** Major-unit decimal string with exactly the currency's minor digits: "1250.50", "-0.05". */
export function toDecimal(m: Money): string {
  const exp = currencyExponent(m.currency);
  const neg = m.amount < 0n;
  const digits = (neg ? -m.amount : m.amount).toString().padStart(exp + 1, "0");
  const int = digits.slice(0, digits.length - exp);
  const frac = exp > 0 ? "." + digits.slice(digits.length - exp) : "";
  return `${neg ? "-" : ""}${int}${frac}`;
}

/** Localised display string, exact for any size (Intl formats decimal strings without floats). */
export function format(m: Money, locale = "en-LK"): string {
  const exp = currencyExponent(m.currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: m.currency,
    minimumFractionDigits: exp,
    maximumFractionDigits: exp,
  }).format(toDecimal(m) as Intl.StringNumericLiteral);
}

function assertSame(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
}

export function add(a: Money, ...rest: Money[]): Money {
  let total = a.amount;
  for (const b of rest) {
    assertSame(a, b);
    total += b.amount;
  }
  return money(total, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSame(a, b);
  return money(a.amount - b.amount, a.currency);
}

export function sum(items: readonly Money[], currency: CurrencyCode): Money {
  return items.reduce((acc, m) => add(acc, m), zero(currency));
}

export function negate(m: Money): Money {
  return money(-m.amount, m.currency);
}

export function absolute(m: Money): Money {
  return m.amount < 0n ? negate(m) : m;
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSame(a, b);
  return a.amount < b.amount ? -1 : a.amount > b.amount ? 1 : 0;
}

export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amount === b.amount;
}

export const isZero = (m: Money): boolean => m.amount === 0n;
export const isNegative = (m: Money): boolean => m.amount < 0n;
export const isPositive = (m: Money): boolean => m.amount > 0n;

export function min(a: Money, b: Money): Money {
  return compare(a, b) <= 0 ? a : b;
}

export function max(a: Money, b: Money): Money {
  return compare(a, b) >= 0 ? a : b;
}

/** `m × factor`, rounded to minor units with `mode`. Factor is exact (string decimal, bigint, Ratio). */
export function multiply(m: Money, factor: Numeric, mode: RoundingMode): Money {
  const r = toRatio(factor);
  return money(divRound(m.amount * r.num, r.den, mode), m.currency);
}

/** `m ÷ divisor`, rounded to minor units with `mode`. */
export function divide(m: Money, divisor: Numeric, mode: RoundingMode): Money {
  const r = toRatio(divisor);
  if (r.num === 0n) throw new RangeError("Division by zero");
  return money(divRound(m.amount * r.den, r.num, mode), m.currency);
}

/** `percent`% of `m`, e.g. percentage(m, "12.5", mode). */
export function percentage(m: Money, percent: Numeric, mode: RoundingMode): Money {
  const r = toRatio(percent);
  return multiply(m, { num: r.num, den: r.den * 100n } satisfies Ratio, mode);
}

/**
 * Splits `m` across `ratios` so the parts sum exactly to `m` (largest-remainder
 * method; ties go to the earliest index). Ratios must be ≥ 0 with a positive total.
 * Negative amounts are allocated symmetrically.
 */
export function allocate(m: Money, ratios: readonly Numeric[]): Money[] {
  if (ratios.length === 0) throw new RangeError("allocate needs at least one ratio");
  const rs = ratios.map(toRatio);
  if (rs.some((r) => r.num < 0n)) throw new RangeError("allocate ratios must be non-negative");

  // Bring all ratios to a common denominator so weights are integers.
  const lcmDen = rs.reduce((acc, r) => lcm(acc, r.den), 1n);
  const weights = rs.map((r) => r.num * (lcmDen / r.den));
  const total = weights.reduce((a, b) => a + b, 0n);
  if (total === 0n) throw new RangeError("allocate ratios must not all be zero");

  const neg = m.amount < 0n;
  const amount = neg ? -m.amount : m.amount;

  const parts = weights.map((w) => (amount * w) / total);
  const remainders = weights.map((w, i) => ({ i, rem: (amount * w) % total }));
  let leftover = amount - parts.reduce((a, b) => a + b, 0n);

  remainders.sort((a, b) => (b.rem > a.rem ? 1 : b.rem < a.rem ? -1 : a.i - b.i));
  for (const { i } of remainders) {
    if (leftover === 0n) break;
    parts[i]! += 1n;
    leftover -= 1n;
  }
  return parts.map((p) => money(neg ? -p : p, m.currency));
}

/** Splits `m` into `n` near-equal parts that sum exactly to `m` (e.g. equal bill split). */
export function allocateEvenly(m: Money, n: number): Money[] {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError("n must be a positive integer");
  return allocate(
    m,
    Array.from({ length: n }, () => 1),
  );
}

/**
 * Rounds `m` to a multiple of `incrementMinor` minor units, e.g. cash rounding to
 * the nearest LKR 1.00 is `roundToIncrement(m, 100n, mode)`.
 */
export function roundToIncrement(m: Money, incrementMinor: bigint, mode: RoundingMode): Money {
  if (incrementMinor <= 0n) throw new RangeError("Increment must be positive");
  return money(divRound(m.amount, incrementMinor, mode) * incrementMinor, m.currency);
}

/** JSON-safe form; bigint is serialised as a string so no precision is lost. */
export function toJSON(m: Money): { amount: string; currency: CurrencyCode } {
  return { amount: m.amount.toString(), currency: m.currency };
}

export function fromJSON(v: { amount: string | number; currency: CurrencyCode }): Money {
  if (typeof v.amount === "string" && !/^-?\d+$/.test(v.amount)) {
    throw new RangeError(`Invalid minor-unit amount: "${v.amount}"`);
  }
  return money(typeof v.amount === "string" ? BigInt(v.amount) : v.amount, v.currency);
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function lcm(a: bigint, b: bigint): bigint {
  return (a / gcd(a, b)) * b;
}
