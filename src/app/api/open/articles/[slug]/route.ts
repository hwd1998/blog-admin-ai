import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOpenApiToken } from '@/lib/open-api-auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await verifyOpenApiToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params

  const article = await prisma.article.findFirst({
    where: { slug, status: 'published' },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      content: true,
      contentFormat: true,
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
  })

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  return NextResponse.json({
    article: {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      content: article.content,
      content_format: article.contentFormat,
      cover_image_url: article.coverImageUrl,
      status: article.status,
      view_count: article.viewCount,
      published_at: article.publishedAt?.toISOString() ?? null,
      created_at: article.createdAt.toISOString(),
      updated_at: article.updatedAt.toISOString(),
      author: article.author,
      categories: article.articleCategories.map((ac) => ac.category),
      tags: article.articleTags.map((at) => at.tag),
    },
  })
}
