'use client'

import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function parseHeadings(html: string): TocItem[] {
  const headings: TocItem[] = []
  const usedIds = new Set<string>()
  const regex = /<(h[23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/\1>/gi
  let match

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1][1])
    const text = match[3].replace(/<[^>]+>/g, '')
    const rawId = match[2]?.trim()
    const baseId = rawId || slugify(text) || `heading-${headings.length + 1}`

    let uniqueId = baseId
    let suffix = 1
    while (usedIds.has(uniqueId)) {
      suffix += 1
      uniqueId = `${baseId}-${suffix}`
    }
    usedIds.add(uniqueId)

    headings.push({ id: uniqueId, text, level })
  }

  // If headings don't have IDs, try to extract without IDs and generate them
  if (headings.length === 0) {
    const regexNoId = /<(h[23])[^>]*>(.*?)<\/\1>/gi
    while ((match = regexNoId.exec(html)) !== null) {
      const level = parseInt(match[1][1])
      const text = match[2].replace(/<[^>]+>/g, '')
      const baseId = slugify(text) || `heading-${headings.length + 1}`

      let uniqueId = baseId
      let suffix = 1
      while (usedIds.has(uniqueId)) {
        suffix += 1
        uniqueId = `${baseId}-${suffix}`
      }
      usedIds.add(uniqueId)

      headings.push({ id: uniqueId, text, level })
    }
  }

  return headings
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const headings = parseHeadings(content)

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [content])

  if (headings.length === 0) return null

  return (
    <aside className="sticky top-20 hidden xl:block w-56 shrink-0">
      <div className="border-l-2 border-outline-variant pl-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-3">
          目录
        </p>
        <nav className="space-y-1">
          {headings.map((heading, index) => (
            <a
              key={`${heading.id}-${index}`}
              href={`#${heading.id}`}
              className={`block text-xs leading-snug py-0.5 transition-colors ${
                heading.level === 3 ? 'pl-3' : ''
              } ${
                activeId === heading.id
                  ? 'text-primary font-medium'
                  : 'text-secondary hover:text-on-surface'
              }`}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(heading.id)
                if (el) {
                  const top = el.getBoundingClientRect().top + window.scrollY - 80
                  window.scrollTo({ top, behavior: 'smooth' })
                }
              }}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}
