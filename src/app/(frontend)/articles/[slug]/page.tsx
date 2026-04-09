import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ArticleContent from '@/components/c/ArticleContent'
import TableOfContents from '@/components/c/TableOfContents'
import CommentList from '@/components/c/CommentList'
import CommentForm from '@/components/c/CommentForm'
import LikeButton from '@/components/c/LikeButton'
import { formatDate } from '@/lib/utils'
import type { Category, Tag } from '@/types'

export const revalidate = 3600

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from('articles')
    .select('title, summary, cover_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) return { title: 'Article Not Found' }

  return {
    title: article.title,
    description: article.summary ?? undefined,
    openGraph: {
      title: article.title,
      description: article.summary ?? undefined,
      images: article.cover_image_url ? [article.cover_image_url] : [],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch full article
  const { data: rawArticle } = await supabase
    .from('articles')
    .select(`
      *,
      article_categories(
        categories(*)
      ),
      article_tags(
        tags(*)
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!rawArticle) notFound()

  const article = {
    ...rawArticle,
    categories: (rawArticle.article_categories ?? [])
      .map((ac: { categories: Category | null }) => ac.categories)
      .filter(Boolean) as Category[],
    tags: (rawArticle.article_tags ?? [])
      .map((at: { tags: Tag | null }) => at.tags)
      .filter(Boolean) as Tag[],
  }

  // Get like count
  const { count: likeCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', article.id)

  // Increment view count (fire-and-forget)
  supabase.rpc('increment_view_count', { article_slug: slug }).then(() => {})

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-secondary mb-8 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="text-outline-variant">/</span>
        {article.categories[0] && (
          <>
            <Link
              href={`/categories/${article.categories[0].slug}`}
              className="hover:text-primary transition-colors"
            >
              {article.categories[0].name}
            </Link>
            <span className="text-outline-variant">/</span>
          </>
        )}
        <span className="text-on-surface truncate max-w-xs">{article.title}</span>
      </nav>

      <div className="flex gap-10">
        {/* Main article */}
        <article className="flex-1 min-w-0">
          {/* Article header */}
          <header className="mb-8">
            {/* Categories */}
            {article.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {article.categories.map((cat: Category) => (
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

            {/* Meta */}
            <div className="flex items-center gap-4 flex-wrap py-3 border-y border-outline-variant">
              {article.published_at && (
                <span className="font-mono text-xs text-secondary tracking-wider">
                  {formatDate(article.published_at)}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-secondary">
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                {article.view_count.toLocaleString()} views
              </span>
              <span className="flex items-center gap-1 text-xs text-secondary">
                <span className="material-symbols-outlined text-[14px]">favorite</span>
                {likeCount ?? 0} likes
              </span>
            </div>
          </header>

          {/* Cover image */}
          {article.cover_image_url && (
            <div className="mb-8 border border-outline-variant overflow-hidden">
              <Image
                src={article.cover_image_url}
                alt={article.title}
                width={900}
                height={450}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          )}

          {/* Article content */}
          <ArticleContent content={article.content} />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-outline-variant">
              {article.tags.map((tag: Tag) => (
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

          {/* Like / Favorite buttons */}
          <LikeButton articleId={article.id} initialLikeCount={likeCount ?? 0} />

          {/* Comments section */}
          <section className="mt-10 pt-8 border-t border-outline-variant">
            <h2 className="font-serif text-xl font-semibold mb-6">
              Discussion
            </h2>

            <CommentList articleId={article.id} />

            <div className="mt-8">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-secondary mb-4">
                Leave a Comment
              </h3>
              <CommentForm articleId={article.id} />
            </div>
          </section>
        </article>

        {/* TOC Sidebar */}
        <TableOfContents content={article.content} />
      </div>
    </div>
  )
}
