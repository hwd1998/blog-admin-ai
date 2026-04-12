'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CommentActionsProps {
  comment: {
    id: string
    status: string
  }
}

export default function CommentActions({ comment }: CommentActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const updateStatus = async (status: string) => {
    setLoading(true)
    await fetch(`/api/admin/comments/${comment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    router.refresh()
  }

  const deleteComment = async () => {
    if (!confirm('Delete this comment permanently?')) return
    setLoading(true)
    await fetch(`/api/admin/comments/${comment.id}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      {comment.status !== 'approved' && (
        <button
          onClick={() => updateStatus('approved')}
          disabled={loading}
          title="Approve"
          className="p-1.5 text-stone-400 hover:text-green-700 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
        </button>
      )}
      {comment.status !== 'rejected' && (
        <button
          onClick={() => updateStatus('rejected')}
          disabled={loading}
          title="Reject"
          className="p-1.5 text-stone-400 hover:text-amber-600 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">cancel</span>
        </button>
      )}
      <button
        onClick={deleteComment}
        disabled={loading}
        title="Delete"
        className="p-1.5 text-stone-400 hover:text-red-700 transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[16px]">delete</span>
      </button>
    </div>
  )
}
