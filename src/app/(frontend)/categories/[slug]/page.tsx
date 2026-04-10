import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ArticleCard from '@/components/c/ArticleCard'
import type { Article, Category, Tag } from '@/types'

export const revalidate = 3600

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('slug')
  return (categories ?? []).map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!category) return { title: '分类未找到' }
  return {
    title: category.name,
    description: category.description ?? `「${category.name}」分类下的文章`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) notFound()

  const { data: rawArticles } = await supabase
    .from('articles')
    .select(`
      *,
      article_categories!inner(
        categories(*),
        category_id
      ),
      article_tags(
        tags(*)
      )
    `)
    .eq('status', 'published')
    .eq('article_categories.category_id', category.id)
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
        <span className="text-on-surface">分类</span>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface">{category.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-10 pb-8 border-b border-outline-variant">
        <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-2">分类</p>
        <h1 className="font-serif text-3xl font-semibold text-on-surface mb-3">{category.name}</h1>
        {category.description && (
          <p className="text-secondary text-base">{category.description}</p>
        )}
        <p className="text-xs text-secondary mt-3 font-mono">
          共 {articles.length} 篇
        </p>
      </header>

      {/* Articles */}
      {articles.length === 0 ? (
        <p className="text-secondary text-center py-12">该分类下暂无文章。</p>
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
