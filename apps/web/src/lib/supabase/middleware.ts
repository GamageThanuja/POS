import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { clientEnv } from "@/env.client";

const PUBLIC_PATHS = ["/login", "/auth"];

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Refreshes the Supabase session cookie and redirects anonymous users to /login. */
export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

  // No session cookie: nothing to refresh, so skip the Auth round-trip.
  if (!hasAuthCookie) {
    if (isPublic(pathname)) return NextResponse.next({ request });
    return redirectToLogin(request, pathname + search);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  // getUser() validates the JWT with Supabase Auth; do not trust getSession() here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic(pathname)) return redirectToLogin(request, pathname + search);
  return response;
}

function redirectToLogin(request: NextRequest, next: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  return NextResponse.redirect(url);
}
