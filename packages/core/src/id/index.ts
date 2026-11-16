import { v7 as uuidv7, validate, version } from "uuid";

/**
 * UUIDv7 ids (CLAUDE.md rule 3): time-ordered, so records created offline on a
 * POS sort correctly and index well once synced.
 */
export type Id = string;

export function newId(): Id {
  return uuidv7();
}

export function isUuidV7(value: unknown): value is Id {
  return typeof value === "string" && validate(value) && version(value) === 7;
}

/** Creation time embedded in a UUIDv7 (first 48 bits, Unix ms). */
export function idTimestamp(id: Id): Date {
  if (!isUuidV7(id)) throw new RangeError(`Not a UUIDv7: ${id}`);
  const hex = id.replace(/-/g, "").slice(0, 12);
  return new Date(Number.parseInt(hex, 16));
}
