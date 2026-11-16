import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/** Walks up from `start` to the directory holding `pnpm-workspace.yaml`. */
export function findWorkspaceRoot(start: string = process.cwd()): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`pnpm-workspace.yaml not found above ${start}`);
    dir = parent;
  }
}

/**
 * Loads `.env` files from the repo root (`.env.local` then `.env`).
 * Variables already present in `process.env` win, so CI/hosting values override files.
 */
export function loadRootEnv(start?: string): string[] {
  const root = findWorkspaceRoot(start);
  const loaded: string[] = [];
  for (const name of [".env.local", ".env"]) {
    const file = join(root, name);
    if (existsSync(file)) {
      process.loadEnvFile(file);
      loaded.push(file);
    }
  }
  return loaded;
}
