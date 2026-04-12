'use client'

import { useRef, useState } from 'react'

interface ImageUploadProps {
  onUpload: (url: string) => void
  label?: string
}

export default function ImageUpload({ onUpload, label = 'Upload Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = (await res.json()) as { url?: string; error?: string }

    if (!res.ok) {
      setError(data.error ?? 'Upload failed')
      setUploading(false)
      return
    }

    if (data.url) {
      onUpload(data.url)
    }
    setUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant text-xs text-secondary hover:text-on-surface hover:border-outline transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[16px]">
          {uploading ? 'hourglass_empty' : 'upload'}
        </span>
        {uploading ? 'Uploading...' : label}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-error text-xs mt-1">{error}</p>
      )}
    </div>
  )
}
