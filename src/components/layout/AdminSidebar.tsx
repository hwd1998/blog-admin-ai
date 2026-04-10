'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin', label: '概览', icon: 'dashboard' },
  { href: '/admin/articles', label: '文章', icon: 'article' },
  { href: '/admin/categories', label: '分类标签', icon: 'label' },
  { href: '/admin/comments', label: '评论', icon: 'chat' },
  { href: '/admin/media', label: '媒体库', icon: 'photo_library' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-56px)] w-[220px] bg-[#1A1A1A] flex flex-col z-40">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-stone-700">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-widest mb-1">HWD BLOG</p>
        <h2 className="text-amber-400 font-semibold text-base tracking-wide">管理后台</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                active
                  ? 'border-l-4 border-amber-500 bg-stone-800/50 text-white pl-4'
                  : 'border-l-4 border-transparent text-stone-400 hover:text-white hover:bg-stone-800/30'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer actions */}
      <div className="border-t border-stone-700 p-4 flex flex-col gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-300 transition-colors py-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          返回前台
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-stone-500 hover:text-red-400 transition-colors py-1 text-left"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          退出登录
        </button>
      </div>
    </aside>
  )
}
