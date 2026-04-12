'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ArticleActionsProps {
  article: {
    id: string
    status: string
    slug: string
  }
}

export default function ArticleActions({ article }: ArticleActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggleStatus = async () => {
    setLoading(true)
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    const published_at =
      newStatus === 'published' ? new Date().toISOString() : null

    await fetch(`/api/admin/articles/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, published_at }),
    })

    setLoading(false)
    router.refresh()
  }

  const deleteArticle = async () => {
    if (!confirm('Are you sure you want to delete this article? This cannot be undone.')) return
    setLoading(true)
    await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      {article.status === 'published' && (
        <Link
          href={`/articles/${article.slug}`}
          target="_blank"
          className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors"
          title="View live"
        >
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </Link>
      )}

      <Link
        href={`/admin/articles/${article.id}`}
        className="p-1.5 text-stone-400 hover:text-amber-700 transition-colors"
        title="Edit"
      >
        <span className="material-symbols-outlined text-[16px]">edit</span>
      </Link>

      <button
        onClick={toggleStatus}
        disabled={loading}
        title={article.status === 'published' ? 'Unpublish' : 'Publish'}
        className="p-1.5 text-stone-400 hover:text-green-700 transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[16px]">
          {article.status === 'published' ? 'visibility_off' : 'publish'}
        </span>
      </button>

      <button
        onClick={deleteArticle}
        disabled={loading}
        title="Delete"
        className="p-1.5 text-stone-400 hover:text-red-700 transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[16px]">delete</span>
      </button>
    </div>
  )
}
