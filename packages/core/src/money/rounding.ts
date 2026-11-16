/**
 * Rounding modes. There is deliberately no default anywhere in the money API:
 * which mode applies to tax, service charge or cash is a business rule (BR-01/BR-02)
 * and must be passed in explicitly from configuration.
 */
export const RoundingMode = {
  /** Half away from zero (2.5 → 3, -2.5 → -3). Common "commercial" rounding. */
  HALF_UP: "HALF_UP",
  /** Half toward zero (2.5 → 2, -2.5 → -2). */
  HALF_DOWN: "HALF_DOWN",
  /** Half to even, "banker's rounding" (2.5 → 2, 3.5 → 4). */
  HALF_EVEN: "HALF_EVEN",
  /** Away from zero (2.1 → 3, -2.1 → -3). */
  UP: "UP",
  /** Toward zero / truncate (2.9 → 2, -2.9 → -2). */
  DOWN: "DOWN",
  /** Toward +∞ (2.1 → 3, -2.9 → -2). */
  CEILING: "CEILING",
  /** Toward −∞ (2.9 → 2, -2.1 → -3). */
  FLOOR: "FLOOR",
} as const;
export type RoundingMode = (typeof RoundingMode)[keyof typeof RoundingMode];

function abs(n: bigint): bigint {
  return n < 0n ? -n : n;
}

/** Integer division `n / d` rounded with `mode`. Exact integer arithmetic. */
export function divRound(n: bigint, d: bigint, mode: RoundingMode): bigint {
  if (d === 0n) throw new RangeError("Division by zero");
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const q = n / d; // truncates toward zero
  const r = n % d; // same sign as n
  if (r === 0n) return q;

  const sign = n < 0n ? -1n : 1n;
  const twice = abs(r) * 2n;
  const awayFromZero = q + sign;

  switch (mode) {
    case RoundingMode.DOWN:
      return q;
    case RoundingMode.UP:
      return awayFromZero;
    case RoundingMode.CEILING:
      return sign > 0n ? awayFromZero : q;
    case RoundingMode.FLOOR:
      return sign < 0n ? awayFromZero : q;
    case RoundingMode.HALF_UP:
      return twice >= d ? awayFromZero : q;
    case RoundingMode.HALF_DOWN:
      return twice > d ? awayFromZero : q;
    case RoundingMode.HALF_EVEN:
      if (twice > d) return awayFromZero;
      if (twice < d) return q;
      return q % 2n === 0n ? q : awayFromZero;
    default: {
      const never: never = mode;
      throw new RangeError(`Unknown rounding mode: ${String(never)}`);
    }
  }
}
