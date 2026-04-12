import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthorSession } from '@/lib/auth-helpers'

function serializeArticle(a: {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string
  contentFormat: string
  coverImageUrl: string | null
  status: string
  viewCount: number
  authorId: string
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
}) {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    summary: a.summary,
    content: a.content,
    content_format: a.contentFormat,
    cover_image_url: a.coverImageUrl,
    status: a.status,
    view_count: a.viewCount,
    author_id: a.authorId,
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
    published_at: a.publishedAt?.toISOString() ?? null,
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const article = await prisma.article.findUnique({ where: { id } })
  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const [artCats, artTags] = await Promise.all([
    prisma.articleCategory.findMany({ where: { articleId: id }, select: { categoryId: true } }),
    prisma.articleTag.findMany({ where: { articleId: id }, select: { tagId: true } }),
  ])

  return NextResponse.json({
    article: serializeArticle(article),
    categoryIds: artCats.map((r) => r.categoryId),
    tagIds: artTags.map((r) => r.tagId),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
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

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.article.findUnique({ where: { id } })
      const publishedAt =
        status === 'published'
          ? body.published_at
            ? new Date(body.published_at)
            : existing?.publishedAt ?? new Date()
          : null

      await tx.article.update({
        where: { id },
        data: {
          title: body.title!.trim(),
          slug: body.slug!.trim(),
          summary: body.summary?.trim() || null,
          content: body.content ?? '',
          contentFormat: body.content_format === 'markdown' ? 'markdown' : 'html',
          coverImageUrl: body.cover_image_url || null,
          status,
          publishedAt,
        },
      })

      await tx.articleCategory.deleteMany({ where: { articleId: id } })
      await tx.articleTag.deleteMany({ where: { articleId: id } })

      const catIds = body.categoryIds ?? []
      const tagIds = body.tagIds ?? []

      if (catIds.length) {
        await tx.articleCategory.createMany({
          data: catIds.map((categoryId) => ({ articleId: id, categoryId })),
        })
      }
      if (tagIds.length) {
        await tx.articleTag.createMany({
          data: tagIds.map((tagId) => ({ articleId: id, tagId })),
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json()) as {
    status?: 'draft' | 'published'
    published_at?: string | null
  }

  if (!body.status) {
    return NextResponse.json({ error: 'status required' }, { status: 400 })
  }

  const publishedAt =
    body.status === 'published'
      ? body.published_at
        ? new Date(body.published_at)
        : new Date()
      : null

  await prisma.article.update({
    where: { id },
    data: {
      status: body.status,
      publishedAt: body.status === 'published' ? publishedAt : null,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await prisma.article.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
