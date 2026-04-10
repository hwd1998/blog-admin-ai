'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchFiles = async () => {
    setLoading(true)
    const { data, error: listError } = await supabase.storage.from('media').list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (listError) {
      setError(listError.message)
      setLoading(false)
      return
    }

    const filesWithUrls: MediaFile[] = (data ?? [])
      .filter((f) => f.name !== '.emptyFolderPlaceholder')
      .map((f) => {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(f.name)
        return {
          ...f,
          id: f.id ?? '',
          publicUrl: urlData.publicUrl,
          metadata: f.metadata ?? { size: 0, mimetype: 'unknown' },
        }
      })

    setFiles(filesWithUrls)
    setLoading(false)
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Only images are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.')
      return
    }

    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file)

    if (uploadError) {
      setError(uploadError.message)
    } else {
      await fetchFiles()
    }

    setUploading(false)
    e.target.value = ''
  }

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const deleteFile = async (name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const { error: delError } = await supabase.storage.from('media').remove([name])
    if (delError) {
      setError(delError.message)
    } else {
      await fetchFiles()
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
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
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
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
            <div key={file.id ?? file.name} className="group relative bg-white border border-stone-200 overflow-hidden">
              {/* Image preview */}
              <div className="aspect-square bg-stone-100 overflow-hidden">
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

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  onClick={() => copyUrl(file.publicUrl, file.id ?? file.name)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-[#1A1A1A] text-xs font-medium hover:bg-stone-100 transition-colors"
                  title="Copy URL"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedId === (file.id ?? file.name) ? 'check' : 'content_copy'}
                  </span>
                  {copiedId === (file.id ?? file.name) ? 'Copied!' : 'Copy URL'}
                </button>
                <button
                  onClick={() => deleteFile(file.name)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  Delete
                </button>
              </div>

              {/* File info */}
              <div className="px-2 py-1.5 border-t border-stone-100">
                <p className="text-xs text-stone-600 truncate" title={file.name}>{file.name}</p>
                {file.metadata?.size && (
                  <p className="text-xs text-stone-400">{formatFileSize(file.metadata.size)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
