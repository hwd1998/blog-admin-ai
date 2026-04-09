import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'The Curator',
    template: '%s | The Curator',
  },
  description: 'An editorial blog with a curated perspective on ideas, culture, and craft.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'The Curator',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-surface text-on-surface antialiased">
        {children}
      </body>
    </html>
  )
}
