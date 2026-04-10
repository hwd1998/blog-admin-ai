import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ArticleCard from '@/components/c/ArticleCard'
import type { Article, Category, Tag } from '@/types'

export const revalidate = 3600

interface TagPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: tags } = await supabase.from('tags').select('slug')
  return (tags ?? []).map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: tag } = await supabase
    .from('tags')
    .select('name')
    .eq('slug', slug)
    .single()

  if (!tag) return { title: '标签未找到' }
  return {
    title: `#${tag.name}`,
    description: `标签「${tag.name}」下的文章`,
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tag) notFound()

  const { data: rawArticles } = await supabase
    .from('articles')
    .select(`
      *,
      article_categories(
        categories(*)
      ),
      article_tags!inner(
        tags(*),
        tag_id
      )
    `)
    .eq('status', 'published')
    .eq('article_tags.tag_id', tag.id)
    .order('published_at', { ascending: false })

  const articles: Article[] = (rawArticles ?? []).map((a) => ({
    ...a,
    categories: (a.article_categories ?? [])
      .map((ac: { categories: Category | null }) => ac.categories)
      .filter(Boolean) as Category[],
    tags: (a.article_tags ?? [])
      .map((at: { tags: Tag | null }) => at.tags)
      .filter(Boolean) as Tag[],
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-secondary mb-8 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">首页</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface">标签</span>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface">#{tag.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-10 pb-8 border-b border-outline-variant">
        <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-2">标签</p>
        <h1 className="font-serif text-3xl font-semibold text-on-surface mb-2">
          <span className="text-secondary">#</span>{tag.name}
        </h1>
        <p className="text-xs text-secondary font-mono">
          共 {articles.length} 篇
        </p>
      </header>

      {/* Articles */}
      {articles.length === 0 ? (
        <p className="text-secondary text-center py-12">该标签下暂无文章。</p>
      ) : (
        <div>
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
