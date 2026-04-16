import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { requireAuthorSession } from '@/lib/auth-helpers'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

export async function POST(request: Request) {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Max 5MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(buffer)

  if (!detected || !ALLOWED_MIME.has(detected.mime) || !ALLOWED_EXT.has(detected.ext)) {
    return NextResponse.json({ error: 'Only jpeg/png/gif/webp images allowed' }, { status: 400 })
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${detected.ext}`

  const dir = path.join(process.cwd(), 'public', 'uploads', 'media')
  await mkdir(dir, { recursive: true })

  await writeFile(path.join(dir, fileName), buffer)

  const publicUrl = `/uploads/media/${fileName}`
  return NextResponse.json({ url: publicUrl })
}
