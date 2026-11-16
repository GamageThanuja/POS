import { describe, expect, it } from "vitest";
import { currencyExponent, isSupportedCurrency, supportedCurrencies } from "./currency";

describe("currency", () => {
  it("knows minor-unit exponents", () => {
    expect(currencyExponent("LKR")).toBe(2);
    expect(currencyExponent("JPY")).toBe(0);
    expect(currencyExponent("KWD")).toBe(3);
  });

  it("rejects unknown codes", () => {
    expect(isSupportedCurrency("XXX")).toBe(false);
    expect(isSupportedCurrency("toString")).toBe(false);
    expect(() => currencyExponent("XXX")).toThrow(/Unsupported currency/);
  });

  it("lists supported codes", () => {
    expect(supportedCurrencies()).toContain("LKR");
  });
});
