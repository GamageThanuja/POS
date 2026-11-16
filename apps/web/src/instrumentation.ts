/** Runs once when the Next server starts: fail fast on a broken environment. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { serverEnv } = await import("@pos/config/env");
    serverEnv();
  }
}
