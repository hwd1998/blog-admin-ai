'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

interface TutorialActionsProps {
  tutorial: { id: string; slug: string }
}

export default function TutorialActions({ tutorial }: TutorialActionsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('确定删除这个教程吗？此操作不可撤销。')) return
    setDeleting(true)
    const res = await fetch(`/api/admin/tutorials/${encodeURIComponent(tutorial.id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      router.refresh()
    } else {
      alert('删除失败，请重试')
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <Link
        href={`/tutorial/${tutorial.slug}`}
        target="_blank"
        className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
      >
        预览
      </Link>
      <Link
        href={`/admin/tutorials/${tutorial.id}`}
        className="text-xs text-amber-600 hover:text-amber-800 transition-colors font-medium"
      >
        编辑
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
      >
        {deleting ? '删除中...' : '删除'}
      </button>
    </div>
  )
}
