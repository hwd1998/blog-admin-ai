import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const articleWithRelationsInclude = {
  articleCategories: { include: { category: true } },
  articleTags: { include: { tag: true } },
} satisfies Prisma.ArticleInclude

export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleWithRelationsInclude
}>

export async function listPublishedArticles(params: {
  page: number
  pageSize: number
  categoryId?: string
  tagId?: string
}) {
  const { page, pageSize, categoryId, tagId } = params
  const skip = (page - 1) * pageSize

  const where: Prisma.ArticleWhereInput = {
    status: 'published',
    ...(categoryId
      ? { articleCategories: { some: { categoryId } } }
      : {}),
    ...(tagId ? { articleTags: { some: { tagId } } } : {}),
  }

  const [total, rows] = await prisma.$transaction([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      include: articleWithRelationsInclude,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: pageSize,
    }),
  ])

  return { total, rows }
}

export async function getPublishedArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, status: 'published' },
    include: articleWithRelationsInclude,
  })
}

export async function incrementArticleViewCount(slug: string) {
  await prisma.article.updateMany({
    where: { slug, status: 'published' },
    data: { viewCount: { increment: 1 } },
  })
}

export async function countLikesForArticle(articleId: string) {
  return prisma.like.count({ where: { articleId } })
}
