'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

export interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
}

interface UseAuthReturn {
  user: AuthUser | null
  loading: boolean
  isAuthor: boolean
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  const [isAuthor, setIsAuthor] = useState(false)

  const user: AuthUser | null = session?.user?.id
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }
    : null

  useEffect(() => {
    if (!user) {
      setIsAuthor(false)
      return
    }
    let cancelled = false
    fetch('/api/auth/is-author')
      .then((res) => res.json())
      .then((data: { isAuthor?: boolean }) => {
        if (!cancelled) setIsAuthor(Boolean(data.isAuthor))
      })
      .catch(() => {
        if (!cancelled) setIsAuthor(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return { user, loading, isAuthor, signOut: handleSignOut }
}
