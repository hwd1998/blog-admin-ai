'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  isAuthor: boolean
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthor, setIsAuthor] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

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

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, isAuthor, signOut }
}
