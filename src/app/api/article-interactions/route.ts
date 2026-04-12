import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSessionUser } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  const articleId = new URL(request.url).searchParams.get('articleId')
  if (!articleId) {
    return NextResponse.json({ error: 'articleId required' }, { status: 400 })
  }

  const user = await requireSessionUser()
  if (!user) {
    return NextResponse.json({ liked: false, favorited: false })
  }

  const [like, fav] = await Promise.all([
    prisma.like.findUnique({
      where: { articleId_userId: { articleId, userId: user.id } },
    }),
    prisma.favorite.findUnique({
      where: { articleId_userId: { articleId, userId: user.id } },
    }),
  ])

  return NextResponse.json({ liked: !!like, favorited: !!fav })
}

export async function POST(request: Request) {
  const user = await requireSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as {
    articleId?: string
    kind?: 'like' | 'favorite'
    action?: 'add' | 'remove'
  }

  if (!body.articleId || !body.kind || !body.action) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { articleId, kind, action } = body

  if (kind === 'like') {
    if (action === 'add') {
      await prisma.like.upsert({
        where: { articleId_userId: { articleId, userId: user.id } },
        create: { articleId, userId: user.id },
        update: {},
      })
    } else {
      await prisma.like.deleteMany({ where: { articleId, userId: user.id } })
    }
  } else {
    if (action === 'add') {
      await prisma.favorite.upsert({
        where: { articleId_userId: { articleId, userId: user.id } },
        create: { articleId, userId: user.id },
        update: {},
      })
    } else {
      await prisma.favorite.deleteMany({ where: { articleId, userId: user.id } })
    }
  }

  return NextResponse.json({ ok: true })
}
