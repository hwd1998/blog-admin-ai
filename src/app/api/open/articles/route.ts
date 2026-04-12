import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOpenApiToken } from '@/lib/open-api-auth'

export async function GET(request: Request) {
  const user = await verifyOpenApiToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') ?? '10', 10)))
  const categorySlug = searchParams.get('category') ?? undefined
  const tagSlug = searchParams.get('tag') ?? undefined
  const skip = (page - 1) * pageSize

  const where = {
    status: 'published',
    ...(categorySlug
      ? { articleCategories: { some: { category: { slug: categorySlug } } } }
      : {}),
    ...(tagSlug
      ? { articleTags: { some: { tag: { slug: tagSlug } } } }
      : {}),
  }

  const [total, rows] = await prisma.$transaction([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        coverImageUrl: true,
        status: true,
        viewCount: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
        articleCategories: { include: { category: { select: { id: true, name: true, slug: true } } } },
        articleTags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: pageSize,
    }),
  ])

  const articles = rows.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    summary: a.summary,
    cover_image_url: a.coverImageUrl,
    status: a.status,
    view_count: a.viewCount,
    published_at: a.publishedAt?.toISOString() ?? null,
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
    author: a.author,
    categories: a.articleCategories.map((ac) => ac.category),
    tags: a.articleTags.map((at) => at.tag),
  }))

  return NextResponse.json({
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
    articles,
  })
}
