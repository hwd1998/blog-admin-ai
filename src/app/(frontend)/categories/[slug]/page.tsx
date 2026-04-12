import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { articleWithRelationsInclude } from '@/lib/data/article-queries'
import { toArticleDTO } from '@/lib/mappers/article'
import ArticleCard from '@/components/c/ArticleCard'
import type { Article } from '@/types'

export const revalidate = 3600

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const rows = await prisma.category.findMany({ select: { slug: true } })
  return rows.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.category.findFirst({
    where: { slug },
    select: { name: true, description: true },
  })

  if (!category) return { title: '分类未找到' }
  return {
    title: category.name,
    description: category.description ?? `「${category.name}」分类下的文章`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  const category = await prisma.category.findFirst({ where: { slug } })
  if (!category) notFound()

  const rawArticles = await prisma.article.findMany({
    where: {
      status: 'published',
      articleCategories: { some: { categoryId: category.id } },
    },
    include: articleWithRelationsInclude,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  })

  const articles: Article[] = rawArticles.map((a) => toArticleDTO(a))

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-secondary mb-8 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">首页</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface">分类</span>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface">{category.name}</span>
      </nav>

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
