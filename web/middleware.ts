import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authRateLimiter, apiMutationRateLimiter, getRateLimitHeaders, getClientIp } from "@/lib/ratelimit";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate Limiting check
  const ip = getClientIp(request);

  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    const rateLimit = await authRateLimiter.limit(`auth-page:${ip}`);
    if (!rateLimit.success) {
      return new NextResponse("Too Many Requests. Please slow down.", {
        status: 429,
        headers: getRateLimitHeaders(rateLimit),
      });
    }
  } else if (pathname.startsWith("/api/collectors") && request.method === "POST") {
    const rateLimit = await apiMutationRateLimiter.limit(`api-collector:${ip}`);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }
  }

  const isProtectedPath =
    pathname.startsWith("/control-room") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/services");

  const hasSessionToken =
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token") ||
    request.cookies.has("auth_session");

  if (isProtectedPath && !hasSessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/api/collectors/:path*",
    "/control-room/:path*",
    "/dashboard/:path*",
    "/inventory/:path*",
    "/services/:path*",
  ],
};

