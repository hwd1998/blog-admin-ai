import type { Article, Category, Tag } from '@/types'
import type { ArticleWithRelations } from '@/lib/data/article-queries'

type CategoryRow = { id: string; name: string; slug: string; description: string | null; createdAt: Date }
type TagRow = { id: string; name: string; slug: string; createdAt: Date }

function mapCategory(c: CategoryRow): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    created_at: c.createdAt.toISOString(),
  }
}

function mapTag(t: TagRow): Tag {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    created_at: t.createdAt.toISOString(),
  }
}

export function toArticleDTO(row: ArticleWithRelations): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: row.content,
    content_format: row.contentFormat === 'markdown' ? 'markdown' : 'html',
    cover_image_url: row.coverImageUrl?.trim() || null,
    status: row.status as Article['status'],
    view_count: row.viewCount,
    author_id: row.authorId,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    published_at: row.publishedAt?.toISOString() ?? null,
    categories: row.articleCategories.map((ac) => mapCategory(ac.category)),
    tags: row.articleTags.map((at) => mapTag(at.tag)),
  }
}
