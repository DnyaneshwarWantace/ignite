import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/login", "/auth/register", "/api/auth"];
const DEFAULT_REDIRECT = "/x-ray";
const ROOT = "/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Skip middleware for static files and API routes (except auth)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  try {
    // Get the session token from the cookies
    const sessionToken = request.cookies.get("next-auth.session-token")?.value;
    
    let isAuthenticated = false;
    
    if (sessionToken) {
      try {
        // Verify the JWT token
        const secret = new TextEncoder().encode(
          process.env.NEXTAUTH_SECRET || "fallback-secret"
        );
        
        await jwtVerify(sessionToken, secret);
        isAuthenticated = true;
      } catch (e) {
        // Token verification failed
        isAuthenticated = false;
      }
    }

    // Redirect authenticated users away from public routes
    if (isPublicRoute && isAuthenticated) {
      return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url));
    }

    // Redirect unauthenticated users to login
    if (!isAuthenticated && !isPublicRoute) {
      return NextResponse.redirect(new URL(ROOT, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, allow the request to continue
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)",
  ],
};
