import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ContentCard, { type ContentItem } from '@/components/c/ContentCard'
import type { Category, Tag } from '@/types'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 10

interface HomePageProps {
  searchParams: Promise<{
    category?: string
    tag?: string
    page?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const categorySlug = params.category
  const tagSlug = params.tag

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  let categoryId: string | undefined
  let tagId: string | undefined

  if (categorySlug) {
    const cat = await prisma.category.findFirst({ where: { slug: categorySlug }, select: { id: true } })
    categoryId = cat?.id
  }
  if (tagSlug) {
    const tag = await prisma.tag.findFirst({ where: { slug: tagSlug }, select: { id: true } })
    tagId = tag?.id
  }

  // ── Fetch articles ──────────────────────────────────────────────────────
  const articleWhere = {
    status: 'published',
    ...(categoryId ? { articleCategories: { some: { categoryId } } } : {}),
    ...(tagId ? { articleTags: { some: { tagId } } } : {}),
  }

  const articleRows = await prisma.article.findMany({
    where: articleWhere,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      coverImageUrl: true,
      viewCount: true,
      publishedAt: true,
      createdAt: true,
      articleCategories: { select: { category: { select: { id: true, name: true, slug: true } } } },
      articleTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
    },
    orderBy: { publishedAt: 'desc' },
  })

  // ── Fetch tutorials (skip when tag filter active — tutorials have no tags) ──
  const tutorialRows = tagId ? [] : await prisma.tutorial.findMany({
    where: {
      status: 'published',
      ...(categoryId ? { tutorialCategories: { some: { categoryId } } } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      coverImageUrl: true,
      publishedAt: true,
      createdAt: true,
      _count: { select: { steps: true } },
      tutorialCategories: { select: { category: { select: { id: true, name: true, slug: true } } } },
      steps: { select: { imageUrl: true }, orderBy: { stepNumber: 'asc' }, take: 1 },
    },
  })

  // ── Merge and sort by date ───────────────────────────────────────────────
  const allItems: ContentItem[] = [
    ...articleRows.map((a) => ({
      type: 'article' as const,
      id: a.id,
      title: a.title,
      slug: a.slug,
      summary: a.summary,
      coverImageUrl: a.coverImageUrl,
      publishedAt: (a.publishedAt ?? a.createdAt).toISOString(),
      categories: a.articleCategories.map((ac) => ac.category),
      viewCount: a.viewCount,
      tags: a.articleTags.map((at) => at.tag),
    })),
    ...tutorialRows.map((t) => ({
      type: 'tutorial' as const,
      id: t.id,
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      // cover: explicit cover > first step image > null (fallback handled in ContentCard)
      coverImageUrl: t.coverImageUrl ?? t.steps[0]?.imageUrl ?? null,
      publishedAt: (t.publishedAt ?? t.createdAt).toISOString(),
      categories: t.tutorialCategories.map((tc) => tc.category),
      stepCount: t._count.steps,
    })),
  ].sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())

  const total = allItems.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const pageItems = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Build URL helper ─────────────────────────────────────────────────────
  const buildUrl = (p: number) => {
    const sp = new URLSearchParams()
    if (categorySlug) sp.set('category', categorySlug)
    if (tagSlug) sp.set('tag', tagSlug)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return qs ? `/?${qs}` : '/'
  }

  const activeFilter = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.name
    : tagSlug
    ? tags.find((t) => t.slug === tagSlug)?.name
    : null

  const categoriesDto: Category[] = categories.map((c) => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description,
    created_at: c.createdAt.toISOString(),
  }))

  const tagsDto: Tag[] = tags.map((t) => ({
    id: t.id, name: t.name, slug: t.slug, created_at: t.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <section className="mb-10 pb-10 border-b border-outline-variant">
        <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-3">个人博客</p>
        <h1 className="font-serif text-4xl font-semibold text-on-surface mb-4 leading-tight">HWD BLOG</h1>
        <p className="text-secondary text-base leading-relaxed">
          随笔、观察与对文化、技艺与值得琢磨的想法的记录。不追更新频率，只在觉得该写的时候发布。
        </p>
      </section>

      <div className="flex gap-10">
        <div className="flex-1 min-w-0">
          {/* {activeFilter && (
            <div className="mb-6 flex items-center gap-3">
              <span className="text-sm text-secondary">
                当前筛选：<span className="font-medium text-on-surface">{activeFilter}</span>
              </span>
              <Link href="/" className="text-xs text-primary hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">close</span>
                清除
              </Link>
            </div>
          )} */}

          {!tagSlug && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Link
                href="/"
                className={`text-xs px-3 py-1.5 border transition-colors ${
                  !categorySlug
                    ? 'bg-primary text-on-primary border-primary'
                    : 'border-outline-variant text-secondary hover:text-on-surface hover:border-outline'
                }`}
              >
                全部
              </Link>
              {categoriesDto.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/?category=${cat.slug}`}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    categorySlug === cat.slug
                      ? 'bg-primary text-on-primary border-primary'
                      : 'border-outline-variant text-secondary hover:text-on-surface hover:border-outline'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {pageItems.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-secondary">暂无内容。</p>
            </div>
          ) : (
            <div>
              {pageItems.map((item) => (
                <ContentCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-8 border-t border-outline-variant mt-4">
              {page > 1 ? (
                <Link href={buildUrl(page - 1)} className="flex items-center gap-1 text-sm text-secondary hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  上一页
                </Link>
              ) : <span />}

              <span className="text-xs text-secondary font-mono">{page} / {totalPages}</span>

              {page < totalPages ? (
                <Link href={buildUrl(page + 1)} className="flex items-center gap-1 text-sm text-secondary hover:text-on-surface transition-colors">
                  下一页
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              ) : <span />}
            </div>
          )}
        </div>

        <aside className="hidden lg:block w-56 shrink-0">
          {tagsDto.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-3 pb-2 border-b border-outline-variant">
                话题
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tagsDto.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className={`text-xs px-2 py-1 border transition-colors ${
                      tagSlug === tag.slug
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-[#F0EDE8] border-outline-variant text-secondary hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {categoriesDto.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-3 pb-2 border-b border-outline-variant">
                分类
              </p>
              <div className="space-y-1">
                {categoriesDto.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/?category=${cat.slug}`}
                    className={`block text-sm py-0.5 transition-colors ${
                      categorySlug === cat.slug
                        ? 'text-primary font-medium'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
