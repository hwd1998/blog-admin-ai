import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { articleWithRelationsInclude } from '@/lib/data/article-queries'
import { toArticleDTO } from '@/lib/mappers/article'
import ArticleCard from '@/components/c/ArticleCard'
import type { Article } from '@/types'

export const revalidate = 3600

interface TagPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const rows = await prisma.tag.findMany({ select: { slug: true } })
  return rows.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = await prisma.tag.findFirst({
    where: { slug },
    select: { name: true },
  })

  if (!tag) return { title: '标签未找到' }
  return {
    title: `#${tag.name}`,
    description: `标签「${tag.name}」下的文章`,
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params

  const tag = await prisma.tag.findFirst({ where: { slug } })
  if (!tag) notFound()

  const rawArticles = await prisma.article.findMany({
    where: {
      status: 'published',
      articleTags: { some: { tagId: tag.id } },
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
        <span className="text-on-surface">标签</span>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface">#{tag.name}</span>
      </nav>

      <header className="mb-10 pb-8 border-b border-outline-variant">
        <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-2">标签</p>
        <h1 className="font-serif text-3xl font-semibold text-on-surface mb-2">
          <span className="text-secondary">#</span>{tag.name}
        </h1>
        <p className="text-xs text-secondary font-mono">
          共 {articles.length} 篇
        </p>
      </header>

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
