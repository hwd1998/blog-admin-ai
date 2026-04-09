'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import type { Category, Tag } from '@/types'

export default function AdminCategoriesPage() {
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  // Category form
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catDesc, setCatDesc] = useState('')
  const [catSlugManual, setCatSlugManual] = useState(false)

  // Tag form
  const [tagName, setTagName] = useState('')
  const [tagSlug, setTagSlug] = useState('')
  const [tagSlugManual, setTagSlugManual] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!catSlugManual && catName) setCatSlug(slugify(catName))
  }, [catName, catSlugManual])

  useEffect(() => {
    if (!tagSlugManual && tagName) setTagSlug(slugify(tagName))
  }, [tagName, tagSlugManual])

  const fetchData = async () => {
    const [{ data: cats }, { data: tagData }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('tags').select('*').order('name'),
    ])
    setCategories(cats ?? [])
    setTags(tagData ?? [])
  }

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim() || !catSlug.trim()) return
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('categories').insert({
      name: catName.trim(),
      slug: catSlug.trim(),
      description: catDesc.trim() || null,
    })

    if (err) {
      setError(err.message)
    } else {
      setCatName('')
      setCatSlug('')
      setCatDesc('')
      setCatSlugManual(false)
      await fetchData()
    }
    setLoading(false)
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return
    await supabase.from('categories').delete().eq('id', id)
    await fetchData()
  }

  const addTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagName.trim() || !tagSlug.trim()) return
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('tags').insert({
      name: tagName.trim(),
      slug: tagSlug.trim(),
    })

    if (err) {
      setError(err.message)
    } else {
      setTagName('')
      setTagSlug('')
      setTagSlugManual(false)
      await fetchData()
    }
    setLoading(false)
  }

  const deleteTag = async (id: string) => {
    if (!confirm('Delete this tag?')) return
    await supabase.from('tags').delete().eq('id', id)
    await fetchData()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">Categories &amp; Tags</h1>
        <p className="text-sm text-stone-500">Manage article taxonomy</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Categories */}
        <div>
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-4">
            Categories ({categories.length})
          </h2>

          {/* Add form */}
          <form onSubmit={addCategory} className="bg-white border border-stone-200 p-5 mb-4 space-y-3">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">New Category</h3>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Name</label>
              <input
                type="text"
                value={catName}
                onChange={(e) => { setCatName(e.target.value); setCatSlugManual(false) }}
                placeholder="e.g. Technology"
                required
                className="w-full px-3 py-2 border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Slug</label>
              <input
                type="text"
                value={catSlug}
                onChange={(e) => { setCatSlug(e.target.value); setCatSlugManual(true) }}
                placeholder="technology"
                required
                className="w-full px-3 py-2 border border-stone-200 text-sm font-mono text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Description (optional)</label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Brief description..."
                className="w-full px-3 py-2 border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              Add Category
            </button>
          </form>

          {/* Category list */}
          <div className="bg-white border border-stone-200">
            {categories.length === 0 ? (
              <div className="p-6 text-sm text-stone-500 text-center">No categories yet.</div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {categories.map((cat) => (
                  <li key={cat.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-[#1A1A1A]">{cat.name}</span>
                      <span className="ml-2 text-xs font-mono text-stone-400">/{cat.slug}</span>
                      {cat.description && (
                        <p className="text-xs text-stone-500 mt-0.5">{cat.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-4">
            Tags ({tags.length})
          </h2>

          {/* Add form */}
          <form onSubmit={addTag} className="bg-white border border-stone-200 p-5 mb-4 space-y-3">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">New Tag</h3>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Name</label>
              <input
                type="text"
                value={tagName}
                onChange={(e) => { setTagName(e.target.value); setTagSlugManual(false) }}
                placeholder="e.g. design"
                required
                className="w-full px-3 py-2 border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Slug</label>
              <input
                type="text"
                value={tagSlug}
                onChange={(e) => { setTagSlug(e.target.value); setTagSlugManual(true) }}
                placeholder="design"
                required
                className="w-full px-3 py-2 border border-stone-200 text-sm font-mono text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              Add Tag
            </button>
          </form>

          {/* Tag list */}
          <div className="bg-white border border-stone-200">
            {tags.length === 0 ? (
              <div className="p-6 text-sm text-stone-500 text-center">No tags yet.</div>
            ) : (
              <div className="p-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-1 bg-stone-100 border border-stone-200 px-2 py-1">
                    <span className="text-xs text-stone-700">#{tag.name}</span>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      className="text-stone-400 hover:text-red-600 transition-colors ml-1"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
