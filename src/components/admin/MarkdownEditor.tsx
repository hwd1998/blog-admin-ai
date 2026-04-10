'use client'

import { useState, useMemo } from 'react'
import { marked } from 'marked'

interface MarkdownEditorProps {
  value: string
  onChange: (markdown: string) => void
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [panel, setPanel] = useState<'edit' | 'preview'>('edit')

  const previewHtml = useMemo(() => {
    const src = value?.trim() ?? ''
    if (!src) return ''
    return marked.parse(src, { async: false }) as string
  }, [value])

  return (
    <div className="border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-outline-variant bg-surface-container-low">
        <button
          type="button"
          onClick={() => setPanel('edit')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            panel === 'edit'
              ? 'bg-surface-container-high text-on-surface'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          编辑
        </button>
        <button
          type="button"
          onClick={() => setPanel('preview')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            panel === 'preview'
              ? 'bg-surface-container-high text-on-surface'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          预览
        </button>
      </div>

      {panel === 'edit' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="使用 Markdown 编写正文（支持 GFM：标题、列表、代码块、表格等）"
          className="w-full min-h-[480px] px-4 py-3 font-mono text-sm leading-relaxed text-on-surface bg-surface-container-lowest border-0 focus:outline-none focus:ring-0 resize-y"
          spellCheck={false}
        />
      ) : (
        <div
          className="prose-custom min-h-[480px] px-4 py-3 text-on-surface overflow-auto"
          dangerouslySetInnerHTML={{
            __html: previewHtml || '<p class="text-secondary text-sm">暂无内容</p>',
          }}
        />
      )}

      <div className="px-4 py-2 border-t border-outline-variant bg-surface-container-low text-xs text-secondary">
        保存时按 Markdown 原文入库；前台展示时再渲染为 HTML。
      </div>
    </div>
  )
}
