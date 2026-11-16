import "server-only";
import { serverEnv } from "@pos/config/env";

/** Validated server env. Throws on first use if anything is missing. */
export const env = serverEnv;
