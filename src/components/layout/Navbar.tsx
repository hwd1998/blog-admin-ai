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
      setUser({ id: session.user.id, email: session.user.email, name: session.user.name })
    } else {
      setUser(null)
    }
  }, [session])

  useEffect(() => {
    if (!user) { setIsAuthor(false); return }
    let cancelled = false
    fetch('/api/auth/is-author')
      .then((r) => r.json())
      .then((data: { isAuthor?: boolean }) => { if (!cancelled) setIsAuthor(Boolean(data.isAuthor)) })
      .catch(() => { if (!cancelled) setIsAuthor(false) })
    return () => { cancelled = true }
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

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="font-serif italic text-xl font-semibold tracking-wide text-white hover:text-amber-400 transition-colors duration-200"
        >
          HWD BLOG
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 text-sm font-medium tracking-wide transition-colors duration-200 active:opacity-70 select-none
                  ${active ? 'text-white' : 'text-stone-400 hover:text-white'}`}
              >
                {link.label}
                {/* Animated underline */}
                <span
                  className={`absolute bottom-0 left-3 right-3 h-0.5 bg-amber-400 transition-all duration-250 ease-out
                    ${active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}
                  style={{ transformOrigin: 'left' }}
                />
              </Link>
            )
          })}

          {!authLoading && user ? (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/15">
              {isAuthor && (
                <Link
                  href="/admin"
                  className={`relative px-3 py-1.5 text-sm font-medium tracking-wide transition-colors duration-200 active:opacity-70 select-none
                    ${isActive('/admin') ? 'text-white' : 'text-stone-400 hover:text-white'}`}
                >
                  后台
                  <span
                    className={`absolute bottom-0 left-3 right-3 h-0.5 bg-amber-400 transition-all duration-250 ease-out
                      ${isActive('/admin') ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}
                    style={{ transformOrigin: 'left' }}
                  />
                </Link>
              )}
              <span className="text-xs text-stone-500 max-w-[120px] truncate px-1">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 text-sm text-stone-400 hover:text-white transition-colors duration-200 active:opacity-70"
              >
                退出
              </button>
            </div>
          ) : !authLoading ? (
            <Link
              href="/login"
              className="ml-2 px-3 py-1.5 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors duration-200 active:opacity-70"
            >
              登录
            </Link>
          ) : null}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2 text-stone-300 hover:text-white transition-colors active:opacity-70"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="菜单"
        >
          <span className="material-symbols-outlined text-[24px]">
            {menuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#1A1A1A] border-t border-white/10 px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-2 py-2.5 text-sm transition-colors active:opacity-70 ${
                  active ? 'text-white font-medium' : 'text-stone-400'
                }`}
              >
                {active && <span className="w-1 h-4 bg-amber-400 rounded-full" />}
                {link.label}
              </Link>
            )
          })}

          {!authLoading && user ? (
            <>
              {isAuthor && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-2 py-2.5 text-sm transition-colors active:opacity-70 ${
                    isActive('/admin') ? 'text-white font-medium' : 'text-stone-400'
                  }`}
                >
                  {isActive('/admin') && <span className="w-1 h-4 bg-amber-400 rounded-full" />}
                  后台
                </Link>
              )}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); void handleSignOut() }}
                className="flex items-center gap-2 px-2 py-2.5 text-sm text-stone-400 w-full text-left active:opacity-70"
              >
                退出
              </button>
            </>
          ) : !authLoading ? (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-2 py-2.5 text-sm text-amber-400 active:opacity-70"
            >
              登录
            </Link>
          ) : null}
        </div>
      )}
    </header>
  )
}
