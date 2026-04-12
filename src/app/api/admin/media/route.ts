import { NextResponse } from 'next/server'
import { readdir, stat, unlink } from 'fs/promises'
import path from 'path'
import { requireAuthorSession } from '@/lib/auth-helpers'

const mediaDir = () => path.join(process.cwd(), 'public', 'uploads', 'media')

export async function GET() {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dir = mediaDir()
  let names: string[] = []
  try {
    names = await readdir(dir)
  } catch {
    return NextResponse.json({ files: [] })
  }

  const files = await Promise.all(
    names
      .filter((n) => n !== '.gitkeep' && !n.startsWith('.'))
      .map(async (name) => {
        const st = await stat(path.join(dir, name)).catch(() => null)
        return {
          name,
          id: name,
          publicUrl: `/uploads/media/${name}`,
          metadata: {
            size: st?.size ?? 0,
            mimetype: 'image/*',
          },
          created_at: st?.birthtime?.toISOString() ?? null,
          updated_at: st?.mtime?.toISOString() ?? null,
        }
      })
  )

  files.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))

  return NextResponse.json({ files })
}

export async function DELETE(request: Request) {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('name')
  if (!raw || raw.includes('..') || raw.includes('/') || raw.includes('\\')) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }

  const filePath = path.join(mediaDir(), path.basename(raw))
  await unlink(filePath)
  return NextResponse.json({ ok: true })
}
