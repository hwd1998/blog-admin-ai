'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Comment } from '@/types'

interface UseCommentsReturn {
  comments: Comment[]
  loading: boolean
  error: string | null
  submitComment: (content: string) => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>
}

export function useComments(articleId: string): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    setError(null)

    const res = await fetch(
      `/api/comments?articleId=${encodeURIComponent(articleId)}`
    )
    if (!res.ok) {
      setError('Failed to load comments')
      setLoading(false)
      return
    }

    const data = (await res.json()) as { comments?: Comment[] }
    setComments(data.comments ?? [])
    setLoading(false)
  }, [articleId])

  useEffect(() => {
    void fetchComments()
  }, [fetchComments])

  const submitComment = async (content: string): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId,
        content: content.trim(),
      }),
    })

    if (res.status === 401) {
      return { success: false, error: 'You must be signed in to comment.' }
    }

    if (!res.ok) {
      return { success: false, error: 'Failed to post comment' }
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
