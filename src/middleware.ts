import { auth } from "@/app/api/auth/[...nextauth]/options";
import { ADMIN_LOGIN, DEFAULT_REDIRECT, PUBLIC_ROUTES, ROOT } from "@/lib/routes";
import { NextRequest, NextResponse } from "next/server";

// CVE-2025-29927: reject requests that try to bypass middleware via x-middleware-subrequest
function blockMiddlewareBypass(req: NextRequest) {
  if (req.headers.get("x-middleware-subrequest")) {
    return new NextResponse(null, { status: 403 });
  }
  return null;
}

const withAuth = auth((req) => {
  try {
    const { nextUrl } = req;
    const isAuthenticated = !!req.auth;
    const pathname = nextUrl.pathname;
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (isPublicRoute && isAuthenticated) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      if (pathname === ADMIN_LOGIN)
        return Response.redirect(new URL(`${basePath}/admin`, nextUrl));
      return Response.redirect(new URL(DEFAULT_REDIRECT, nextUrl));
    }

    if (!isAuthenticated && !isPublicRoute) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const isAdminRoute = pathname === `${basePath}/admin` || pathname.startsWith(`${basePath}/admin/`);
      const loginUrl = new URL(isAdminRoute ? ADMIN_LOGIN : ROOT, nextUrl);
      loginUrl.searchParams.set("callbackUrl", isAdminRoute ? `${basePath}/admin` : pathname);
      return Response.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (err) {
    console.error("[middleware] auth error:", err);
    return Response.redirect(new URL(ROOT, req.nextUrl));
  }
});

export default function middleware(req: NextRequest) {
  const blocked = blockMiddlewareBypass(req);
  if (blocked) return blocked;
  return withAuth(req, {});
}

export const config = {
  // Exclude api, all _next (static/image/HMR/chunks), static files
  matcher: [
    "/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)",
  ],
};
