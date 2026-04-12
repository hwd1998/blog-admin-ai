'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import type { AuthUser } from '@/hooks/useAuth'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      })
    } else {
      setUser(null)
    }
  }, [session])

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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/', label: '首页' },
    { href: '/about', label: '关于' },
  ]

  const authLoading = status === 'loading'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 backdrop-blur-sm border-b border-outline-variant">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        <Link
          href="/"
          className="font-serif italic text-xl font-semibold tracking-wide text-on-surface hover:text-primary transition-colors"
        >
          HWD BLOG
        </Link>

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

          {!authLoading && user ? (
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
              <span className="text-xs text-secondary max-w-[140px] truncate">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm text-secondary hover:text-on-surface transition-colors"
              >
                退出
              </button>
            </div>
          ) : !authLoading ? (
            <Link
              href="/login"
              className="text-sm font-medium text-primary hover:text-primary-container transition-colors"
            >
              登录
            </Link>
          ) : null}
        </nav>

        <button
          type="button"
          className="md:hidden p-2 text-on-surface"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="菜单"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-outline-variant bg-white px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm text-on-surface"
            >
              {link.label}
            </Link>
          ))}
          {!authLoading && user ? (
            <>
              {isAuthor && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="block py-2 text-sm">
                  后台
                </Link>
              )}
              <button type="button" onClick={() => { setMenuOpen(false); void handleSignOut() }} className="block py-2 text-sm w-full text-left">
                退出
              </button>
            </>
          ) : !authLoading ? (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-primary">
              登录
            </Link>
          ) : null}
        </div>
      )}
    </header>
  )
}
