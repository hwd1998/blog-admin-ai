'use client'

import { useEffect, useState } from 'react'

interface LikeButtonProps {
  articleId: string
  initialLikeCount: number
}

export default function LikeButton({ articleId, initialLikeCount }: LikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const sessionRes = await fetch('/api/auth/session')
      const session = (await sessionRes.json()) as { user?: { id?: string } } | null
      const uid = session?.user?.id
      if (uid) {
        setUserId(uid)
        const res = await fetch(`/api/article-interactions?articleId=${encodeURIComponent(articleId)}`)
        const data = (await res.json()) as { liked?: boolean; favorited?: boolean }
        setLiked(Boolean(data.liked))
        setFavorited(Boolean(data.favorited))
      }
      setLoading(false)
    }

    init()
  }, [articleId])

  const postInteraction = async (
    kind: 'like' | 'favorite',
    action: 'add' | 'remove'
  ) => {
    await fetch('/api/article-interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, kind, action }),
    })
  }

  const toggleLike = async () => {
    if (!userId) return

    if (liked) {
      setLiked(false)
      setLikeCount((c) => c - 1)
      await postInteraction('like', 'remove')
    } else {
      setLiked(true)
      setLikeCount((c) => c + 1)
      await postInteraction('like', 'add')
    }
  }

  const toggleFavorite = async () => {
    if (!userId) return

    if (favorited) {
      setFavorited(false)
      await postInteraction('favorite', 'remove')
    } else {
      setFavorited(true)
      await postInteraction('favorite', 'add')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-4 py-6 border-t border-outline-variant">
        <div className="h-9 w-24 bg-surface-container animate-pulse" />
        <div className="h-9 w-24 bg-surface-container animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 py-6 border-t border-outline-variant">
      <button
        onClick={toggleLike}
        title={userId ? (liked ? '取消赞' : '点赞') : '登录后点赞'}
        disabled={!userId}
        className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-colors disabled:opacity-50 ${
          liked
            ? 'bg-primary-fixed border-primary text-primary'
            : 'bg-transparent border-outline-variant text-secondary hover:border-primary hover:text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>
          favorite
        </span>
        <span>{likeCount}</span>
      </button>

      <button
        onClick={toggleFavorite}
        title={userId ? (favorited ? '取消收藏' : '收藏') : '登录后收藏'}
        disabled={!userId}
        className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-colors disabled:opacity-50 ${
          favorited
            ? 'bg-primary-fixed border-primary text-primary'
            : 'bg-transparent border-outline-variant text-secondary hover:border-primary hover:text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: favorited ? "'FILL' 1" : "'FILL' 0" }}>
          bookmark
        </span>
        <span>{favorited ? '已收藏' : '收藏'}</span>
      </button>

      {!userId && (
        <span className="text-xs text-secondary ml-2">
          <a href="/login" className="text-primary hover:underline">登录</a> 后可互动
        </span>
      )}
    </div>
  )
}
