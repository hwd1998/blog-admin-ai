import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthorSession } from '@/lib/auth-helpers'
import { revalidateArticleRelatedPaths } from '@/lib/revalidateArticleRoutes'

export async function POST(request: Request) {
  const user = await requireAuthorSession()
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
          authorId: user.id,
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

    const catIds = body.categoryIds ?? []
    const tagIds = body.tagIds ?? []
    await revalidateArticleRelatedPaths({
      slug: article.slug,
      categoryIds: catIds,
      tagIds: tagIds,
    })

    return NextResponse.json({ article: { id: article.id } })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Create failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
