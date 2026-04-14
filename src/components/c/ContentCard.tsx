import Link from 'next/link'
import { formatDate, truncate } from '@/lib/utils'
import defaultCover from '@/assets/default_cover_blog.png'

export type ContentItem = {
  type: 'article' | 'tutorial'
  id: string
  title: string
  slug: string
  summary: string | null
  coverImageUrl: string | null
  publishedAt: string | null
  categories: { id: string; name: string; slug: string }[]
  viewCount?: number
  tags?: { id: string; name: string; slug: string }[]
  stepCount?: number
}

export default function ContentCard({ item }: { item: ContentItem }) {
  const href = item.type === 'tutorial' ? `/tutorial/${item.slug}` : `/articles/${item.slug}`
  const coverImageUrl = item.coverImageUrl || defaultCover.src

  return (
    <article className="border-b border-outline-variant py-7 last:border-b-0 group">
      <div className="flex gap-6">
        {/* Cover */}
        <Link href={href} className="flex-shrink-0 hidden sm:block">
          <div className="w-48 h-32 overflow-hidden rounded-lg border border-outline-variant relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            {item.type === 'tutorial' && (
              <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded">
                教程
              </span>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            {/* Mobile tutorial badge + categories */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {item.type === 'tutorial' && (
                <span className="sm:hidden text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 bg-amber-500 text-white rounded">
                  教程
                </span>
              )}
              {item.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="text-xs font-semibold tracking-widest uppercase text-primary hover:text-primary-container transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {/* Title */}
            <h2 className="font-serif text-xl font-semibold leading-snug mb-2.5">
              <Link href={href} className="text-on-surface hover:text-primary transition-colors">
                {item.title}
              </Link>
            </h2>

            {/* Summary */}
            {item.summary && (
              <p className="text-secondary text-sm leading-relaxed line-clamp-2">
                {truncate(item.summary, 140)}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 flex-wrap mt-4">
            {item.publishedAt && (
              <span className="font-mono text-xs text-secondary tracking-wider">
                {formatDate(item.publishedAt)}
              </span>
            )}

            {item.type === 'article' && item.viewCount !== undefined && (
              <span className="flex items-center gap-1 text-xs text-secondary">
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                {item.viewCount.toLocaleString()}
              </span>
            )}

            {item.type === 'tutorial' && item.stepCount !== undefined && (
              <span className="flex items-center gap-1 text-xs text-secondary">
                <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                {item.stepCount} 步
              </span>
            )}

            {item.type === 'article' && item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="text-xs px-2 py-0.5 bg-[#F0EDE8] border border-outline-variant text-secondary hover:bg-surface-container-high hover:text-on-surface transition-colors rounded"
                  >
                    #{tag.name}
                  </Link>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-xs text-secondary">+{item.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
