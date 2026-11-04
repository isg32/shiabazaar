import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export const runtime = "nodejs";

const accountMiddleware = auth.middleware({ loginUrl: "/auth/sign-in" });

// Neon Auth's session cookie (always `__Secure-` prefixed by the library).
const SESSION_COOKIE = "__Secure-neon-auth.session_token";

/*
 * Optimistic check only: middleware runs on every request — including the
 * background prefetch of each sidebar link — in the edge region nearest the
 * visitor, which is far from the database (us-east-1). Doing a session lookup +
 * DB role query here made every staff click wait seconds. The real role check
 * lives in the /admin, /desk and /dashboard layouts and pages
 * (`require*Page` in lib/staff-guard.ts) and in every staff API route.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/desk") || pathname.startsWith("/dashboard")) {
    if (!request.cookies.has(SESSION_COOKIE)) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    return accountMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/desk/:path*", "/dashboard/:path*", "/account/:path*"],
};
