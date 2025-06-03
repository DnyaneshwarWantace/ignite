import { auth } from "@/app/api/auth/[...nextauth]/options";
import { DEFAULT_REDIRECT, PUBLIC_ROUTES, ROOT } from "@/lib/routes";

export default auth((req) => {
  const { nextUrl, headers } = req;

  const isAuthenticated = !!req.auth;

  const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname);

  if (isPublicRoute && isAuthenticated)
    return Response.redirect(new URL(DEFAULT_REDIRECT, nextUrl));

  if (!isAuthenticated && !isPublicRoute)
    return Response.redirect(new URL(ROOT, nextUrl));
});

export const config = {
  // Matcher to include all routes except necessary Next.js system paths
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)",
  ],
};
