import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'HWD BLOG',
    template: '%s | HWD BLOG',
  },
  description: '个人写作与随笔博客，记录想法、技术、文化与创作。',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'HWD BLOG',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-surface text-on-surface antialiased">
        {children}
      </body>
    </html>
  )
}
