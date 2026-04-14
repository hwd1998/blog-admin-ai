import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { articleWithRelationsInclude } from '@/lib/data/article-queries'
import { toArticleDTO } from '@/lib/mappers/article'
import ContentCard, { type ContentItem } from '@/components/c/ContentCard'

export const dynamic = 'force-dynamic'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
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
    description: category.description ?? `「${category.name}」分类下的内容`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  const category = await prisma.category.findFirst({ where: { slug } })
  if (!category) notFound()

  const [rawArticles, tutorialRows] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'published', articleCategories: { some: { categoryId: category.id } } },
      include: articleWithRelationsInclude,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.tutorial.findMany({
      where: { status: 'published', tutorialCategories: { some: { categoryId: category.id } } },
      select: {
        id: true, title: true, slug: true, summary: true,
        coverImageUrl: true, publishedAt: true, createdAt: true,
        _count: { select: { steps: true } },
        tutorialCategories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        steps: { select: { imageUrl: true }, orderBy: { stepNumber: 'asc' }, take: 1 },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    }),
  ])

  const items: ContentItem[] = [
    ...rawArticles.map((a) => {
      const dto = toArticleDTO(a)
      return {
        type: 'article' as const,
        id: dto.id,
        title: dto.title,
        slug: dto.slug,
        summary: dto.summary,
        coverImageUrl: dto.cover_image_url,
        publishedAt: dto.published_at ?? dto.created_at,
        categories: dto.categories ?? [],
        viewCount: dto.view_count,
        tags: dto.tags ?? [],
      }
    }),
    ...tutorialRows.map((t) => ({
      type: 'tutorial' as const,
      id: t.id,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      coverImageUrl: t.coverImageUrl ?? t.steps[0]?.imageUrl ?? null,
      publishedAt: (t.publishedAt ?? t.createdAt).toISOString(),
      categories: t.tutorialCategories.map((tc) => tc.category),
      stepCount: t._count.steps,
    })),
  ].sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())

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
        <p className="text-xs text-secondary mt-3 font-mono">共 {items.length} 篇</p>
      </header>

      {items.length === 0 ? (
        <p className="text-secondary text-center py-12">该分类下暂无内容。</p>
      ) : (
        <div>
          {items.map((item) => (
            <ContentCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
