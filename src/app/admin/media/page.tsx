'use client'

import { useEffect, useState } from 'react'

interface MediaFile {
  name: string
  id: string
  updated_at: string | null
  created_at: string | null
  metadata: {
    size: number
    mimetype: string
  }
  publicUrl: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function buildAbsoluteUrl(url: string): string {
  if (typeof window === 'undefined') return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${window.location.origin}${url}`
}

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchFiles = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/media')
    if (!res.ok) {
      setError('加载失败')
      setLoading(false)
      return
    }
    const data = (await res.json()) as { files?: MediaFile[] }
    setFiles(data.files ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('仅允许上传图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('文件大小不能超过 5MB')
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const j = (await res.json()) as { error?: string }
      setError(j.error ?? '上传失败')
    } else {
      await fetchFiles()
    }

    setUploading(false)
    e.target.value = ''
  }

  const copyUrl = async (url: string, id: string) => {
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(buildAbsoluteUrl(url))
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // 降级：创建临时 input 复制
      try {
        const input = document.createElement('input')
        input.value = buildAbsoluteUrl(url)
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      } catch {
        setCopyError('复制失败，请手动复制')
        setTimeout(() => setCopyError(null), 3000)
      }
    }
  }

  const deleteFile = async (name: string) => {
    setDeleting(true)
    const res = await fetch(`/api/admin/media?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      setError('删除失败')
    } else {
      await fetchFiles()
    }
    setConfirmDeleteId(null)
    setDeleting(false)
  }

  const fileKey = (file: MediaFile) => file.id ?? file.name

  return (
    <div className="p-8">
      {/* 删除确认弹窗 */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-sm mx-4 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-red-500 text-[24px]">warning</span>
              <h2 className="text-base font-semibold text-[#1A1A1A]">确认删除</h2>
            </div>
            <p className="text-sm text-stone-600 mb-1">
              即将删除文件：
            </p>
            <p className="text-sm text-stone-800 font-medium truncate mb-4 bg-stone-50 px-3 py-2">
              {files.find(f => fileKey(f) === confirmDeleteId)?.name}
            </p>
            <p className="text-xs text-stone-400 mb-6">此操作不可撤销，删除后无法恢复。</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-stone-600 border border-stone-200 hover:border-stone-400 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const file = files.find(f => fileKey(f) === confirmDeleteId)
                  if (file) deleteFile(file.name)
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">媒体库</h1>
          <p className="text-sm text-stone-500">共 {files.length} 个文件</p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">upload</span>
          {uploading ? '上传中...' : '上传图片'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {copyError && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          {copyError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-stone-500">
          <span className="material-symbols-outlined text-[32px] animate-spin mr-2">autorenew</span>
          加载中...
        </div>
      ) : files.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-stone-300">
          <span className="material-symbols-outlined text-[64px] text-stone-300 block mb-3">photo_library</span>
          <p className="text-stone-500 text-sm mb-2">暂无媒体文件</p>
          <p className="text-stone-400 text-xs">点击右上角按钮上传图片</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {files.map((file) => (
            <div key={fileKey(file)} className="group relative bg-white border border-stone-200 overflow-hidden">
              <div className="h-32 bg-stone-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.publicUrl}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => copyUrl(file.publicUrl, fileKey(file))}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-[#1A1A1A] text-xs font-medium hover:bg-stone-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedId === fileKey(file) ? 'check' : 'content_copy'}
                  </span>
                  {copiedId === fileKey(file) ? '已复制' : '复制链接'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(fileKey(file))}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  删除
                </button>
              </div>

              <div className="px-2 py-1.5 border-t border-stone-100">
                <p className="text-xs text-stone-600 truncate" title={file.name}>{file.name}</p>
                {file.metadata?.size ? (
                  <p className="text-xs text-stone-400">{formatFileSize(file.metadata.size)}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
