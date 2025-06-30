'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthWrapper({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (requireAuth && !session) {
      // Redirect to login if authentication is required but user is not logged in
      router.push(redirectTo)
      return
    }

    if (!requireAuth && session) {
      // Redirect to dashboard if user is logged in but trying to access public routes
      router.push('/x-ray')
      return
    }
  }, [session, status, requireAuth, redirectTo, router])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Don't render children if redirecting
  if (requireAuth && !session) return null
  if (!requireAuth && session) return null

  return <>{children}</>
} 