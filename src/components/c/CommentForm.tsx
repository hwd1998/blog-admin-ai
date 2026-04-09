'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface CommentFormProps {
  articleId: string
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

export default function CommentForm({ articleId }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be signed in to comment.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('comments').insert({
      article_id: articleId,
      author_id: user.id,
      author_name: getDisplayName(user),
      content: content.trim(),
      status: 'pending',
    })

    if (insertError) {
      setError('Failed to submit comment. Please try again.')
      setSubmitting(false)
      return
    }

    setContent('')
    setSubmitted(true)
    setSubmitting(false)
    router.refresh()
  }

  if (submitted) {
    return (
      <div className="p-4 bg-surface-container border border-outline-variant">
        <div className="flex items-center gap-2 text-sm text-secondary">
          <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
          Your comment has been submitted and is awaiting approval.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="comment" className="block text-xs font-semibold tracking-widest uppercase text-secondary mb-2">
          Your Comment
        </label>
        <textarea
          id="comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Share your thoughts..."
          required
          className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant text-on-surface text-sm placeholder:text-secondary focus:outline-none focus:border-primary resize-none transition-colors"
        />
      </div>

      {error && (
        <p className="text-error text-xs">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-6 py-2 bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Publish Comment'}
        </button>
      </div>
    </form>
  )
}
