/** ISO 4217 code, e.g. "LKR". */
export type CurrencyCode = string;

/**
 * Minor-unit exponent per currency (ISO 4217). LKR has 2 (cents), JPY 0, KWD 3.
 * Extend this table when a tenant needs another currency.
 */
const EXPONENTS: Readonly<Record<string, number>> = {
  LKR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  AUD: 2,
  SGD: 2,
  AED: 2,
  MVR: 2,
  JPY: 0,
  KWD: 3,
  BHD: 3,
  OMR: 3,
};

export function isSupportedCurrency(code: string): boolean {
  return Object.hasOwn(EXPONENTS, code);
}

export function currencyExponent(code: CurrencyCode): number {
  const exp = EXPONENTS[code];
  if (exp === undefined) throw new RangeError(`Unsupported currency: ${code}`);
  return exp;
}

export function supportedCurrencies(): CurrencyCode[] {
  return Object.keys(EXPONENTS);
}
