import { describe, expect, it } from "vitest";
import { AppError, ErrorCode, andThen, err, map, ok, tryAsync, unwrap } from "./index";

describe("Result", () => {
  it("maps and chains", () => {
    expect(map(ok(2), (v) => v * 3)).toEqual(ok(6));
    const e = err("bad");
    expect(map(e, (v: number) => v * 3)).toBe(e);
    expect(andThen(ok(2), (v) => ok(v + 1))).toEqual(ok(3));
    expect(andThen(ok(2), () => err("no"))).toEqual(err("no"));
    expect(andThen(e, (v: number) => ok(v))).toBe(e);
  });

  it("unwraps or throws", () => {
    expect(unwrap(ok(1))).toBe(1);
    const appErr = new AppError(ErrorCode.NOT_FOUND, "missing");
    expect(() => unwrap(err(appErr))).toThrow(appErr);
    expect(() => unwrap(err("plain"))).toThrow("plain");
  });

  it("captures thrown errors", async () => {
    expect(await tryAsync(async () => 5)).toEqual(ok(5));
    const conflict = new AppError(ErrorCode.CONFLICT, "dup");
    expect(
      await tryAsync(async () => {
        throw conflict;
      }),
    ).toEqual(err(conflict));
    const r = await tryAsync(async () => {
      throw new Error("boom");
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe(ErrorCode.INTERNAL);
      expect(r.error.cause).toBeInstanceOf(Error);
    }
  });
});

describe("AppError", () => {
  it("maps codes to HTTP status and serialises safely", () => {
    const e = new AppError(ErrorCode.BUSINESS_RULE, "Journal is unbalanced", {
      details: { debit: "100", credit: "90" },
    });
    expect(e.httpStatus).toBe(422);
    expect(JSON.parse(JSON.stringify(e))).toEqual({
      code: "BUSINESS_RULE",
      message: "Journal is unbalanced",
      details: { debit: "100", credit: "90" },
    });
    expect(new AppError(ErrorCode.FORBIDDEN, "no").toJSON()).toEqual({
      code: "FORBIDDEN",
      message: "no",
    });
    expect(new AppError(ErrorCode.RATE_LIMITED, "slow").httpStatus).toBe(429);
  });
});
