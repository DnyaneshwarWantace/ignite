import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Temporarily disabled middleware to avoid Edge Runtime eval errors on Render
export function middleware(request: NextRequest) {
  // Allow all requests to pass through without any authentication checks
  return NextResponse.next()
}

// Minimal matcher to reduce processing
export const config = {
  matcher: [
    // Only match non-static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
