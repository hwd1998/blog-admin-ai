import Link from 'next/link'
import type { Article } from '@/types'
import { formatDate, truncate } from '@/lib/utils'
import defaultCover from '@/assets/default_cover_blog.png'

interface ArticleCardProps {
  article: Article
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const coverImageUrl = article.cover_image_url || defaultCover.src

  return (
    <article className="border-b border-outline-variant py-6 last:border-b-0 group">
      <div className="flex gap-5">
        {/* Cover image - 左侧，更大更醒目 */}
        <Link 
          href={`/articles/${article.slug}`} 
          className="flex-shrink-0 hidden sm:block"
        >
          <div className="w-44 h-32 overflow-hidden border border-outline-variant">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
        </Link>

        {/* Content - 右侧 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Categories */}
            {article.categories && article.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1.5">
                {article.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="text-xs font-semibold tracking-widest uppercase text-primary hover:text-primary-container transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h2 className="font-serif text-xl font-semibold leading-snug mb-2">
              <Link
                href={`/articles/${article.slug}`}
                className="text-on-surface hover:text-primary transition-colors group-hover:text-primary"
              >
                {article.title}
              </Link>
            </h2>

            {/* Summary */}
            {article.summary && (
              <p className="text-secondary text-sm leading-relaxed line-clamp-2">
                {truncate(article.summary, 140)}
              </p>
            )}
          </div>

          {/* Meta row - 底部对齐 */}
          <div className="flex items-center gap-4 flex-wrap mt-3">
            {/* Date */}
            {article.published_at && (
              <span className="font-mono text-xs text-secondary tracking-wider">
                {formatDate(article.published_at)}
              </span>
            )}

            {/* Views */}
            <span className="flex items-center gap-1 text-xs text-secondary">
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              {article.view_count.toLocaleString()}
            </span>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {article.tags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="text-xs px-2 py-0.5 bg-[#F0EDE8] border border-outline-variant text-secondary hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
                {article.tags.length > 3 && (
                  <span className="text-xs text-secondary">+{article.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
