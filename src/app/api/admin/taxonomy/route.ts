import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthorSession } from '@/lib/auth-helpers'

function cat(c: { id: string; name: string; slug: string; description: string | null; createdAt: Date }) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    created_at: c.createdAt.toISOString(),
  }
}

function tag(t: { id: string; name: string; slug: string; createdAt: Date }) {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    created_at: t.createdAt.toISOString(),
  }
}

export async function GET() {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  return NextResponse.json({
    categories: categories.map(cat),
    tags: tags.map(tag),
  })
}
