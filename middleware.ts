import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './src/app/api/auth/[...nextauth]/options'

// List of public paths that don't require authentication
const publicPaths = ['/login', '/api/auth']

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (authentication routes)
     * 2. /_next/* (Next.js internals)
     * 3. /static/* (static files)
     * 4. /*.* (files with extensions)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
} 