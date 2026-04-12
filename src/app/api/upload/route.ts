import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { requireAuthorSession } from '@/lib/auth-helpers'

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

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Max 5MB' }, { status: 400 })
  }

  const ext = (file as File).name?.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const dir = path.join(process.cwd(), 'public', 'uploads', 'media')
  await mkdir(dir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, fileName), buffer)

  const publicUrl = `/uploads/media/${fileName}`
  return NextResponse.json({ url: publicUrl })
}
