import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

/** 文章变更后刷新前台相关静态缓存（ISR） */
export async function revalidateArticleRelatedPaths(params: {
  slug: string
  previousSlug?: string | null
  categoryIds: string[]
  prevCategoryIds?: string[]
  tagIds: string[]
  prevTagIds?: string[]
}) {
  revalidatePath('/')
  revalidatePath(`/articles/${params.slug}`)
  if (params.previousSlug && params.previousSlug !== params.slug) {
    revalidatePath(`/articles/${params.previousSlug}`)
  }

  const catIds = [...new Set([...params.categoryIds, ...(params.prevCategoryIds ?? [])])]
  const tIds = [...new Set([...params.tagIds, ...(params.prevTagIds ?? [])])]

  if (catIds.length) {
    const cats = await prisma.category.findMany({
      where: { id: { in: catIds } },
      select: { slug: true },
    })
    for (const c of cats) revalidatePath(`/categories/${c.slug}`)
  }
  if (tIds.length) {
    const tags = await prisma.tag.findMany({
      where: { id: { in: tIds } },
      select: { slug: true },
    })
    for (const t of tags) revalidatePath(`/tags/${t.slug}`)
  }
}
