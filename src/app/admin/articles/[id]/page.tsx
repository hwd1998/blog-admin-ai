'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import ImageUpload from '@/components/admin/ImageUpload'
import MarkdownEditor from '@/components/admin/MarkdownEditor'
import type { ArticleContentFormat, Category, Tag } from '@/types'

const Editor = dynamic(() => import('@/components/admin/Editor'), { ssr: false })

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contentFormat, setContentFormat] = useState<ArticleContentFormat>('html')
  const [editorRemountKey, setEditorRemountKey] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const [artRes, taxRes] = await Promise.all([
        fetch(`/api/admin/articles/${encodeURIComponent(articleId)}`),
        fetch('/api/admin/taxonomy'),
      ])

      if (!artRes.ok) {
        setLoading(false)
        return
      }

      const artJson = (await artRes.json()) as {
        article: {
          title: string
          slug: string
          summary: string | null
          content: string
          content_format: string
          cover_image_url: string | null
          status: 'draft' | 'published'
        }
        categoryIds: string[]
        tagIds: string[]
      }
      const taxJson = (await taxRes.json()) as { categories: Category[]; tags: Tag[] }

      const article = artJson.article
      setTitle(article.title)
      setSlug(article.slug)
      setSummary(article.summary ?? '')
      setContent(article.content)
      setContentFormat(article.content_format === 'markdown' ? 'markdown' : 'html')
      setCoverImageUrl(article.cover_image_url ?? '')
      setStatus(article.status)

      setCategories(taxJson.categories ?? [])
      setTags(taxJson.tags ?? [])
      setSelectedCategories(artJson.categoryIds ?? [])
      setSelectedTags(artJson.tagIds ?? [])
      setLoading(false)
    }

    fetchData()
  }, [articleId])

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const handleSave = async (saveStatus: 'draft' | 'published' = status) => {
    if (!title.trim()) {
      setError('标题不能为空')
      return
    }

    setSaving(true)
    setError(null)

    const res = await fetch(`/api/admin/articles/${encodeURIComponent(articleId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim() || null,
        content,
        content_format: contentFormat,
        cover_image_url: coverImageUrl || null,
        status: saveStatus,
        published_at: saveStatus === 'published' ? new Date().toISOString() : null,
        categoryIds: selectedCategories,
        tagIds: selectedTags,
      }),
    })

    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      setError(data.error ?? 'Update failed')
      setSaving(false)
      return
    }

    setSaving(false)
    router.push('/admin/articles')
    router.refresh()
  }

  const selectContentFormat = (fmt: ArticleContentFormat) => {
    if (fmt === contentFormat) return
    setContentFormat(fmt)
    if (fmt === 'html') {
      setEditorRemountKey((k) => k + 1)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-stone-500">
          <span className="material-symbols-outlined text-[24px] animate-spin">autorenew</span>
          加载中...
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">编辑文章</h1>
          <p className="text-sm text-stone-500 font-mono">/articles/{slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/articles')}
            className="px-4 py-2 border border-stone-300 text-stone-600 text-sm hover:bg-stone-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '提交'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-6">
        {/* Main editor */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
              className="w-full px-0 py-2 bg-transparent border-b-2 border-stone-300 focus:border-amber-500 text-[#1A1A1A] text-2xl font-semibold font-serif placeholder:text-stone-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="简介或副标题..."
              rows={2}
              className="w-full px-0 py-2 bg-transparent border-b border-stone-200 focus:border-amber-400 text-stone-600 text-base placeholder:text-stone-400 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">正文编辑</span>
              <div className="inline-flex rounded border border-stone-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => selectContentFormat('html')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    contentFormat === 'html'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  富文本
                </button>
                <button
                  type="button"
                  onClick={() => selectContentFormat('markdown')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-stone-200 ${
                    contentFormat === 'markdown'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Markdown
                </button>
              </div>
            </div>
            {contentFormat === 'html' ? (
              <Editor key={editorRemountKey} content={content} onChange={setContent} />
            ) : (
              <MarkdownEditor value={content} onChange={setContent} />
            )}
          </div>
        </div>

        {/* Settings sidebar */}
        <div className="w-64 shrink-0 space-y-5">
          {/* Status */}
          <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">状态</h3>
            <div className="flex gap-2">
              {(['draft', 'published'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-1.5 text-xs font-medium border transition-colors ${
                    status === s
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {s === 'draft' ? '草稿' : '已发布'}
                </button>
              ))}
            </div>
          </div>

          {/* Slug */}
          <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">链接标识</h3>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="article-slug"
              className="w-full px-2 py-1.5 border border-stone-200 text-xs font-mono text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Cover image */}
          <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">封面图片</h3>
            {coverImageUrl ? (
              <div className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImageUrl} alt="Cover" className="w-full h-28 object-cover border border-stone-200" />
                <button
                  onClick={() => setCoverImageUrl('')}
                  className="mt-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  移除
                </button>
              </div>
            ) : null}
            <div className="space-y-2">
              <ImageUpload onUpload={setCoverImageUrl} label="上传封面" />
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-2 py-1.5 border border-stone-200 text-xs text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">分类</h3>
            {categories.length === 0 ? (
              <p className="text-xs text-stone-400">暂无分类</p>
            ) : (
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="w-3.5 h-3.5 accent-amber-500"
                    />
                    <span className="text-xs text-stone-700 group-hover:text-stone-900">{cat.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">标签</h3>
            {tags.length === 0 ? (
              <p className="text-xs text-stone-400">暂无标签</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`text-xs px-2 py-0.5 border transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
