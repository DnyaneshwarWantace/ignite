import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define routes that don't require authentication
const PUBLIC_FILE = /\.(.*)$/
const PUBLIC_ROUTES = ['/login', '/auth/register', '/api/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public files and API routes
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/')
  ) {
    return NextResponse.next()
  }

  // Check if the route is public
  const isPublicRoute = PUBLIC_ROUTES.some(path => pathname.startsWith(path))

  // Get session token
  const token = request.cookies.get('next-auth.session-token')

  // Redirect logic
  if (!token && !isPublicRoute) {
    // Redirect to login if no token and trying to access protected route
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  if (token && isPublicRoute) {
    // Redirect to dashboard if has token and trying to access public route
    const url = new URL('/x-ray', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Configure which routes should run the middleware
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api/ (API routes)
     * 2. /_next/ (Next.js internals)
     * 3. /static (public files)
     * 4. all files in the public folder
     */
    '/((?!api/|_next/|static/|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
