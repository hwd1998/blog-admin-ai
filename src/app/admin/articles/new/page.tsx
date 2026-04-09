'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import ImageUpload from '@/components/admin/ImageUpload'
import type { Category, Tag } from '@/types'

const Editor = dynamic(() => import('@/components/admin/Editor'), { ssr: false })

export default function NewArticlePage() {
  const router = useRouter()
  const supabase = createClient()

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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cats }, { data: tagData }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('tags').select('*').order('name'),
      ])
      setCategories(cats ?? [])
      setTags(tagData ?? [])
    }
    fetchData()
  }, [])

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title))
    }
  }, [title, slugManuallyEdited])

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
      setError('Title is required.')
      return
    }
    if (!slug.trim()) {
      setError('Slug is required.')
      return
    }

    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated.')
      setSaving(false)
      return
    }

    const articleData = {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim() || null,
      content,
      cover_image_url: coverImageUrl || null,
      status: saveStatus,
      author_id: user.id,
      published_at: saveStatus === 'published' ? new Date().toISOString() : null,
    }

    const { data: article, error: insertError } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    // Insert categories and tags
    const insertPromises: Promise<unknown>[] = []

    if (selectedCategories.length > 0) {
      insertPromises.push(
        supabase.from('article_categories').insert(
          selectedCategories.map((catId) => ({
            article_id: article.id,
            category_id: catId,
          }))
        )
      )
    }

    if (selectedTags.length > 0) {
      insertPromises.push(
        supabase.from('article_tags').insert(
          selectedTags.map((tagId) => ({
            article_id: article.id,
            tag_id: tagId,
          }))
        )
      )
    }

    await Promise.all(insertPromises)

    router.push('/admin/articles')
    router.refresh()
  }

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">New Article</h1>
          <p className="text-sm text-stone-500">Create a new editorial piece</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Publish'}
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
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article Title"
              className="w-full px-0 py-2 bg-transparent border-b-2 border-stone-300 focus:border-amber-500 text-[#1A1A1A] text-2xl font-semibold font-serif placeholder:text-stone-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Summary */}
          <div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary or subtitle..."
              rows={2}
              className="w-full px-0 py-2 bg-transparent border-b border-stone-200 focus:border-amber-400 text-stone-600 text-base placeholder:text-stone-400 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Editor */}
          <div className="mt-4">
            <Editor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Settings sidebar */}
        <div className="w-64 shrink-0 space-y-5">
          {/* Status */}
          <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Status</h3>
            <div className="flex gap-2">
              {(['draft', 'published'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-1.5 text-xs font-medium border transition-colors capitalize ${
                    status === s
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Slug */}
          <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Slug</h3>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugManuallyEdited(true)
              }}
              placeholder="article-slug"
              className="w-full px-2 py-1.5 border border-stone-200 text-xs font-mono text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Cover image */}
          <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Cover Image</h3>
            {coverImageUrl ? (
              <div className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImageUrl} alt="Cover" className="w-full h-28 object-cover border border-stone-200" />
                <button
                  onClick={() => setCoverImageUrl('')}
                  className="mt-1 text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <div className="space-y-2">
              <ImageUpload onUpload={setCoverImageUrl} label="Upload Cover" />
              <div className="flex items-center gap-1 text-xs text-stone-400">
                <span>or paste URL:</span>
              </div>
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
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Categories</h3>
            {categories.length === 0 ? (
              <p className="text-xs text-stone-400">No categories yet.</p>
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
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Tags</h3>
            {tags.length === 0 ? (
              <p className="text-xs text-stone-400">No tags yet.</p>
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
