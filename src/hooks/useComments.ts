'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Comment } from '@/types'

interface UseCommentsReturn {
  comments: Comment[]
  loading: boolean
  error: string | null
  submitComment: (content: string) => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>
}

function getDisplayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const metadataName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
    (typeof user.user_metadata?.preferred_username === 'string' && user.user_metadata.preferred_username)

  if (metadataName && metadataName.trim()) return metadataName.trim()
  if (user.email) return user.email.split('@')[0]
  return 'Reader'
}

export function useComments(articleId: string): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // createClient returns a stable singleton for browser clients
  const supabase = createClient()

  const fetchComments = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', articleId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setComments(data ?? [])
    }

    setLoading(false)
  }, [articleId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const submitComment = async (content: string): Promise<{ success: boolean; error?: string }> => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be signed in to comment.' }
    }

    const { error: insertError } = await supabase.from('comments').insert({
      article_id: articleId,
      author_id: user.id,
      author_name: getDisplayName(user),
      content: content.trim(),
      status: 'pending',
    })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true }
  }

  return {
    comments,
    loading,
    error,
    submitComment,
    refetch: fetchComments,
  }
}
