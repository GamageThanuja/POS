/**
 * An exact rational number `num / den` (den > 0). Used for factors such as
 * quantities ("1.250"), percentages ("12.5") and ratios without touching floats.
 */
export interface Ratio {
  readonly num: bigint;
  readonly den: bigint;
}

/** Anything accepted as an exact numeric factor. JS numbers must be safe integers. */
export type Numeric = bigint | number | string | Ratio;

const DECIMAL_RE = /^([+-])?(\d+)(?:\.(\d+))?$/;

export function parseDecimal(value: string): Ratio {
  const m = DECIMAL_RE.exec(value.trim());
  if (!m) throw new RangeError(`Not a decimal number: "${value}"`);
  const [, sign, int, frac = ""] = m;
  const num = BigInt(int + frac) * (sign === "-" ? -1n : 1n);
  return { num, den: 10n ** BigInt(frac.length) };
}

export function toRatio(value: Numeric): Ratio {
  if (typeof value === "bigint") return { num: value, den: 1n };
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new RangeError(
        `Non-integer or unsafe number ${value}; pass decimals as strings (e.g. "1.25")`,
      );
    }
    return { num: BigInt(value), den: 1n };
  }
  if (typeof value === "string") return parseDecimal(value);
  if (value.den === 0n) throw new RangeError("Ratio denominator is zero");
  return value.den < 0n ? { num: -value.num, den: -value.den } : value;
}
