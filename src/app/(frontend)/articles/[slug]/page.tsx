import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getPublishedArticleBySlug,
  incrementArticleViewCount,
  countLikesForArticle,
} from '@/lib/data/article-queries'
import { toArticleDTO } from '@/lib/mappers/article'
import ArticleContent from '@/components/c/ArticleContent'
import TableOfContents from '@/components/c/TableOfContents'
import CommentList from '@/components/c/CommentList'
import CommentForm from '@/components/c/CommentForm'
import LikeButton from '@/components/c/LikeButton'
import { formatDate } from '@/lib/utils'
import { articleBodyToDisplayHtml } from '@/lib/articleHtml'
import type { Category, Tag } from '@/types'

export const revalidate = 3600

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const row = await getPublishedArticleBySlug(slug)

  if (!row) return { title: '文章未找到' }

  return {
    title: row.title,
    description: row.summary ?? undefined,
    openGraph: {
      title: row.title,
      description: row.summary ?? undefined,
      images: row.coverImageUrl ? [row.coverImageUrl] : [],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const rawArticle = await getPublishedArticleBySlug(slug)

  if (!rawArticle) notFound()

  const article = toArticleDTO(rawArticle)
  const categories = article.categories ?? []
  const tags = article.tags ?? []

  const likeCount = await countLikesForArticle(article.id)
  incrementArticleViewCount(slug).then(() => {})

  const displayHtml = articleBodyToDisplayHtml(
    article.content,
    article.content_format ?? 'html'
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-secondary mb-8 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">首页</Link>
        <span className="text-outline-variant">/</span>
        {categories[0] && (
          <>
            <Link
              href={`/categories/${categories[0].slug}`}
              className="hover:text-primary transition-colors"
            >
              {categories[0].name}
            </Link>
            <span className="text-outline-variant">/</span>
          </>
        )}
        <span className="text-on-surface truncate max-w-xs">{article.title}</span>
      </nav>

      <div className="flex gap-10">
        <article className="flex-1 min-w-0">
          <header className="mb-8">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {categories.map((cat: Category) => (
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

            <h1 className="font-serif text-3xl md:text-4xl font-semibold leading-tight text-on-surface mb-4">
              {article.title}
            </h1>

            {article.summary && (
              <p className="text-secondary text-lg leading-relaxed mb-4 font-light">
                {article.summary}
              </p>
            )}

            <div className="flex items-center gap-4 flex-wrap py-3 border-y border-outline-variant">
              {article.published_at && (
                <span className="font-mono text-xs text-secondary tracking-wider">
                  {formatDate(article.published_at)}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-secondary">
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                {article.view_count.toLocaleString()} 次阅读
              </span>
              <span className="flex items-center gap-1 text-xs text-secondary">
                <span className="material-symbols-outlined text-[14px]">favorite</span>
                {likeCount} 赞
              </span>
            </div>
          </header>

          {article.cover_image_url && (
            <div className="mb-8 border border-outline-variant overflow-hidden">
              {/* 封面为任意外链 URL，与后台/列表一致使用原生 img，避免 next/image 未放行域名与图床对优化请求的拦截 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.cover_image_url}
                alt={article.title}
                width={900}
                height={450}
                className="w-full h-auto object-cover"
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <ArticleContent content={displayHtml} />

          {tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-outline-variant">
              {tags.map((tag: Tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="text-xs px-3 py-1 bg-[#F0EDE8] border border-outline-variant text-secondary hover:bg-surface-container-high hover:text-on-surface transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          <LikeButton articleId={article.id} initialLikeCount={likeCount} />

          <section className="mt-10 pt-8 border-t border-outline-variant">
            <h2 className="font-serif text-xl font-semibold mb-6">
              讨论
            </h2>

            <CommentList articleId={article.id} />

            <div className="mt-8">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-secondary mb-4">
                发表评论
              </h3>
              <CommentForm articleId={article.id} />
            </div>
          </section>
        </article>

        <TableOfContents content={displayHtml} />
      </div>
    </div>
  )
}
