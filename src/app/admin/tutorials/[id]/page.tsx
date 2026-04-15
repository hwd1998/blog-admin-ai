'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import ImageUpload from '@/components/admin/ImageUpload'
import MarkdownEditor from '@/components/admin/MarkdownEditor'
import type { ArticleContentFormat, Category } from '@/types'

const Editor = dynamic(() => import('@/components/admin/Editor'), { ssr: false })

type StepDraft = {
  id?: string
  localId: string
  title: string
  content: string
  contentFormat: ArticleContentFormat
  imageUrl: string
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function createEmptyStep(): StepDraft {
  return { localId: generateId(), title: '', content: '', contentFormat: 'html', imageUrl: '' }
}

export default function EditTutorialPage() {
  const router = useRouter()
  const params = useParams()
  const tutorialId = params.id as string

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [summary, setSummary] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [steps, setSteps] = useState<StepDraft[]>([createEmptyStep()])
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [stepEditorKeys, setStepEditorKeys] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [tutRes, taxRes] = await Promise.all([
        fetch(`/api/admin/tutorials/${encodeURIComponent(tutorialId)}`),
        fetch('/api/admin/taxonomy'),
      ])

      if (!tutRes.ok) { setLoading(false); return }

      const tutJson = (await tutRes.json()) as {
        tutorial: {
          title: string
          slug: string
          summary: string | null
          cover_image_url: string | null
          status: 'draft' | 'published'
        }
        categoryIds: string[]
        steps: Array<{
          id: string
          title: string | null
          content: string
          content_format: string
          image_url: string | null
        }>
      }
      const taxJson = (await taxRes.json()) as { categories: Category[] }

      const t = tutJson.tutorial
      setTitle(t.title)
      setSlug(t.slug)
      setSummary(t.summary ?? '')
      setCoverImageUrl(t.cover_image_url ?? '')
      setStatus(t.status)
      setSelectedCategories(tutJson.categoryIds ?? [])
      setCategories(taxJson.categories ?? [])
      setSteps(
        tutJson.steps.map((s) => ({
          id: s.id,
          localId: generateId(),
          title: s.title ?? '',
          content: s.content,
          contentFormat: (s.content_format as ArticleContentFormat) ?? 'html',
          imageUrl: s.image_url ?? '',
        }))
      )
      setLoading(false)
    }
    fetchData()
  }, [tutorialId])

  const updateStep = (index: number, patch: Partial<StepDraft>) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))

  const addStep = () => {
    setSteps((prev) => [...prev, createEmptyStep()])
    setActiveStepIndex(steps.length)
  }

  const removeStep = (index: number) => {
    if (steps.length === 1) return
    setSteps((prev) => prev.filter((_, i) => i !== index))
    setActiveStepIndex((prev) => Math.min(prev, steps.length - 2))
  }

  const moveStep = (index: number, dir: 'up' | 'down') => {
    const next = dir === 'up' ? index - 1 : index + 1
    if (next < 0 || next >= steps.length) return
    setSteps((prev) => {
      const arr = [...prev]
      ;[arr[index], arr[next]] = [arr[next], arr[index]]
      return arr
    })
    setActiveStepIndex(next)
  }

  const switchStepFormat = (index: number, fmt: ArticleContentFormat) => {
    if (steps[index].contentFormat === fmt) return
    updateStep(index, { contentFormat: fmt })
    if (fmt === 'html') setStepEditorKeys((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }))
  }

  const toggleCategory = (id: string) =>
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  const handleSave = async (saveStatus: 'draft' | 'published' = status) => {
    if (!title.trim()) { setError('标题不能为空'); return }

    setSaving(true)
    setError(null)

    const res = await fetch(`/api/admin/tutorials/${encodeURIComponent(tutorialId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim() || null,
        cover_image_url: coverImageUrl || null,
        status: saveStatus,
        published_at: saveStatus === 'published' ? new Date().toISOString() : null,
        categoryIds: selectedCategories,
        steps: steps.map((s, i) => ({
          id: s.id,
          step_number: i + 1,
          title: s.title.trim() || null,
          content: s.content,
          content_format: s.contentFormat,
          image_url: s.imageUrl || null,
        })),
      }),
    })

    const data = (await res.json()) as { error?: string }
    if (!res.ok) { setError(data.error ?? 'Update failed'); setSaving(false); return }

    setSaving(false)
    router.push('/admin/tutorials')
    router.refresh()
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
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">编辑教程</h1>
          <p className="text-sm text-stone-500 font-mono">/tutorial/{slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/tutorials')}
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
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <div className="flex gap-6">
        {/* Main area */}
        <div className="flex-1 min-w-0 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="教程标题"
            className="w-full px-0 py-2 bg-transparent border-b-2 border-stone-300 focus:border-amber-500 text-[#1A1A1A] text-2xl font-semibold font-serif placeholder:text-stone-400 focus:outline-none transition-colors"
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="这个教程讲什么，一两句话概括..."
            rows={2}
            className="w-full px-0 py-2 bg-transparent border-b border-stone-200 focus:border-amber-400 text-stone-600 text-base placeholder:text-stone-400 focus:outline-none transition-colors resize-none"
          />

          {/* Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                步骤 ({steps.length})
              </span>
              <button
                onClick={addStep}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-300 text-stone-600 hover:bg-stone-100 hover:border-stone-400 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                添加步骤
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => {
                const isActive = activeStepIndex === index
                return (
                  <div
                    key={step.localId}
                    className={`border transition-colors ${isActive ? 'border-amber-400 bg-white' : 'border-stone-200 bg-white hover:border-stone-300'}`}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                      onClick={() => setActiveStepIndex(isActive ? -1 : index)}
                    >
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isActive ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm text-stone-600 truncate">
                        {step.title ? (
                          step.title
                        ) : (
                          <span className="text-stone-400 italic">Step {index + 1} — 无标题</span>
                        )}
                      </span>
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => moveStep(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                        </button>
                        <button
                          onClick={() => moveStep(index, 'down')}
                          disabled={index === steps.length - 1}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                        </button>
                        <button
                          onClick={() => removeStep(index)}
                          disabled={steps.length === 1}
                          className="p-1 ml-1 text-stone-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-stone-400 ml-1">
                        {isActive ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>

                    {isActive && (
                      <div className="px-4 pb-5 border-t border-stone-100 space-y-4 pt-3">
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStep(index, { title: e.target.value })}
                          placeholder="步骤标题（可选）"
                          className="w-full px-2 py-1.5 border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
                        />

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">步骤内容</span>
                            <div className="inline-flex rounded border border-stone-200 overflow-hidden">
                              {(['html', 'markdown'] as const).map((fmt, i) => (
                                <button
                                  key={fmt}
                                  type="button"
                                  onClick={() => switchStepFormat(index, fmt)}
                                  className={`px-3 py-1 text-xs font-medium transition-colors ${i > 0 ? 'border-l border-stone-200' : ''} ${
                                    step.contentFormat === fmt
                                      ? 'bg-amber-500 text-white border-amber-500'
                                      : 'bg-white text-stone-600 hover:bg-stone-50'
                                  }`}
                                >
                                  {fmt === 'html' ? '富文本' : 'Markdown'}
                                </button>
                              ))}
                            </div>
                          </div>
                          {step.contentFormat === 'html' ? (
                            <Editor
                              key={stepEditorKeys[index] ?? 0}
                              content={step.content}
                              onChange={(val) => updateStep(index, { content: val })}
                            />
                          ) : (
                            <MarkdownEditor
                              value={step.content}
                              onChange={(val) => updateStep(index, { content: val })}
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">步骤截图</span>
                          {step.imageUrl && (
                            <div>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={step.imageUrl}
                                alt={`Step ${index + 1}`}
                                className="h-32 object-cover border border-stone-200"
                              />
                              <button
                                onClick={() => updateStep(index, { imageUrl: '' })}
                                className="mt-1 text-xs text-red-600 hover:text-red-800 block transition-colors"
                              >
                                移除
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <ImageUpload
                              onUpload={(url) => updateStep(index, { imageUrl: url })}
                              label="上传截图"
                            />
                            <span className="text-xs text-stone-400">或</span>
                            <input
                              type="url"
                              value={step.imageUrl}
                              onChange={(e) => updateStep(index, { imageUrl: e.target.value })}
                              placeholder="https://..."
                              className="flex-1 min-w-0 px-2 py-1.5 border border-stone-200 text-xs text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              onClick={addStep}
              className="mt-3 w-full py-2.5 border border-dashed border-stone-300 text-xs text-stone-500 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              添加下一步
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-64 shrink-0 space-y-5">
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

          <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">链接标识</h3>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tutorial-slug"
              className="w-full px-2 py-1.5 border border-stone-200 text-xs font-mono text-stone-700 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="bg-white border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">封面图片</h3>
            {coverImageUrl && (
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
            )}
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
        </div>
      </div>
    </div>
  )
}
