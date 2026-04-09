'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user && process.env.NEXT_PUBLIC_AUTHOR_UID) {
        setIsAuthor(user.id === process.env.NEXT_PUBLIC_AUTHOR_UID)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user && process.env.NEXT_PUBLIC_AUTHOR_UID) {
        setIsAuthor(session.user.id === process.env.NEXT_PUBLIC_AUTHOR_UID)
      } else {
        setIsAuthor(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/', label: '首页' },
    { href: '/about', label: '关于' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 backdrop-blur-sm border-b border-outline-variant">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="font-serif italic text-xl font-semibold tracking-wide text-on-surface hover:text-primary transition-colors"
        >
          THE CURATOR
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-colors ${
                pathname === link.href
                  ? 'text-primary border-b-2 border-primary-fixed-dim pb-0.5'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-4">
              {isAuthor && (
                <Link
                  href="/admin"
                  className={`text-sm font-medium tracking-wide transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'text-primary border-b-2 border-primary-fixed-dim pb-0.5'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  后台
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-secondary hover:text-on-surface transition-colors"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-secondary hover:text-on-surface transition-colors"
            >
              登录
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-secondary"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-xl">
            {menuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-outline-variant px-4 py-3 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium py-1 ${
                pathname === link.href ? 'text-primary' : 'text-secondary'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              {isAuthor && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium py-1 text-secondary"
                >
                  后台
                </Link>
              )}
              <button
                onClick={() => { handleSignOut(); setMenuOpen(false) }}
                className="text-sm font-medium py-1 text-secondary text-left"
              >
                退出
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium py-1 text-secondary"
            >
              登录
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
