'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Redirect to /admin — middleware will gate based on AUTHOR_UID
      // Non-authors will be redirected to / by middleware
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="font-serif italic text-2xl font-semibold text-on-surface">
              HWD BLOG
            </span>
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-on-surface mb-1">
            登录
          </h1>
          <p className="text-secondary text-sm">登录后可点赞、收藏与评论</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold tracking-widest uppercase text-secondary mb-1.5">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant text-on-surface text-sm placeholder:text-secondary focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold tracking-widest uppercase text-secondary mb-1.5">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant text-on-surface text-sm placeholder:text-secondary focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-error-container border border-error text-error text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-on-primary text-sm font-semibold tracking-wide hover:bg-primary-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* Guest access */}
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-xs text-secondary tracking-wider">或</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>
          <Link
            href="/"
            className="block w-full py-2.5 border border-outline-variant text-secondary text-sm font-medium text-center hover:border-primary hover:text-primary transition-colors"
          >
            以游客身份浏览
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-secondary">
            游客可阅读全部文章，登录后可点赞、评论
          </p>
        </div>
      </div>
    </div>
  )
}
