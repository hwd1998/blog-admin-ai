import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthorSession } from '@/lib/auth-helpers'

export async function POST(request: Request) {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as { name?: string; slug?: string }
  if (!body.name?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: 'name and slug required' }, { status: 400 })
  }

  try {
    await prisma.tag.create({
      data: {
        name: body.name.trim(),
        slug: body.slug.trim(),
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Create failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  await prisma.tag.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
