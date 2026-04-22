import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOpenApiToken } from '@/lib/open-api-auth'
import { revalidateArticleRelatedPaths } from '@/lib/revalidateArticleRoutes'

export async function POST(request: Request) {
  const user = await verifyOpenApiToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as {
    title?: string
    slug?: string
    summary?: string | null
    content?: string
    content_format?: string
    cover_image_url?: string | null
    status?: 'draft' | 'published'
    published_at?: string | null
    categoryIds?: string[]
    tagIds?: string[]
  }

  if (!body.title?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: 'title and slug required' }, { status: 400 })
  }

  const status = body.status === 'published' ? 'published' : 'draft'
  const publishedAt =
    status === 'published'
      ? body.published_at
        ? new Date(body.published_at)
        : new Date()
      : null

  const coverUrl =
    typeof body.cover_image_url === 'string'
      ? body.cover_image_url.trim() || null
      : body.cover_image_url ?? null

  try {
    const article = await prisma.$transaction(async (tx) => {
      const a = await tx.article.create({
        data: {
          title: body.title!.trim(),
          slug: body.slug!.trim(),
          summary: body.summary?.trim() || null,
          content: body.content ?? '',
          contentFormat: body.content_format === 'markdown' ? 'markdown' : 'html',
          coverImageUrl: coverUrl,
          status,
          authorId: user.sub!,
          publishedAt,
        },
      })

      const catIds = body.categoryIds ?? []
      const tagIds = body.tagIds ?? []

      if (catIds.length) {
        await tx.articleCategory.createMany({
          data: catIds.map((categoryId) => ({ articleId: a.id, categoryId })),
        })
      }
      if (tagIds.length) {
        await tx.articleTag.createMany({
          data: tagIds.map((tagId) => ({ articleId: a.id, tagId })),
        })
      }

      return a
    })

    await revalidateArticleRelatedPaths({
      slug: article.slug,
      categoryIds: body.categoryIds ?? [],
      tagIds: body.tagIds ?? [],
    })

    return NextResponse.json({ article: { id: article.id } })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Create failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

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
