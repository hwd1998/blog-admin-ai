export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Article {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string
  cover_image_url: string | null
  status: 'draft' | 'published'
  view_count: number
  author_id: string
  created_at: string
  updated_at: string
  published_at: string | null
  tags?: Tag[]
  categories?: Category[]
  like_count?: number
  comment_count?: number
}

export interface Comment {
  id: string
  article_id: string
  author_id: string
  author_name?: string | null
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  author?: {
    id: string
    email: string
  }
}

export interface Like {
  id: string
  article_id: string
  user_id: string
  created_at: string
}

export interface Favorite {
  id: string
  article_id: string
  user_id: string
  created_at: string
}

export interface ArticleTag {
  article_id: string
  tag_id: string
}

export interface ArticleCategory {
  article_id: string
  category_id: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AdminStats {
  totalArticles: number
  totalViews: number
  totalComments: number
  pendingComments: number
}
