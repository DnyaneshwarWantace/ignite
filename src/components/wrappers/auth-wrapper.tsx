'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth: boolean
}

export function AuthWrapper({ children, requireAuth }: AuthWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (requireAuth && !session) {
      // Redirect to login with callback URL
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
    } else if (!requireAuth && session) {
      // Redirect authenticated users away from login
      router.push('/x-ray')
    }
  }, [session, status, requireAuth, router, pathname])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show children only if authentication requirements are met
  if ((requireAuth && session) || (!requireAuth && !session)) {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
} 