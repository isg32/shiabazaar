import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

const accountMiddleware = auth.middleware({ loginUrl: "/auth/sign-in" });

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }
    if (session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    return accountMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
