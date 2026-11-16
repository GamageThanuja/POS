/** Only allow same-origin relative paths as post-login targets (blocks open redirects). */
export function safeNextPath(next: unknown, fallback = "/dashboard"): string {
  if (
    typeof next !== "string" ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\")
  ) {
    return fallback;
  }
  return next;
}
