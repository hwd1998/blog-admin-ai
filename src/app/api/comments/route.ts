import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSessionUser } from '@/lib/auth-helpers'

function displayName(user: { email?: string | null; name?: string | null }) {
  if (user.name?.trim()) return user.name.trim()
  if (user.email) return user.email.split('@')[0] ?? '读者'
  return '读者'
}

export async function GET(request: Request) {
  const articleId = new URL(request.url).searchParams.get('articleId')
  if (!articleId) {
    return NextResponse.json({ error: 'articleId required' }, { status: 400 })
  }

  const rows = await prisma.comment.findMany({
    where: { articleId, status: 'approved' },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    comments: rows.map((c) => ({
      id: c.id,
      article_id: c.articleId,
      author_id: c.authorId,
      author_name: c.authorName,
      content: c.content,
      status: c.status,
      created_at: c.createdAt.toISOString(),
    })),
  })
}

export async function POST(request: Request) {
  const user = await requireSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as { articleId?: string; content?: string }
  if (!body.articleId || !body.content?.trim()) {
    return NextResponse.json({ error: 'articleId and content required' }, { status: 400 })
  }

  await prisma.comment.create({
    data: {
      articleId: body.articleId,
      authorId: user.id,
      authorName: displayName(user),
      content: body.content.trim(),
      status: 'pending',
    },
  })

  return NextResponse.json({ ok: true })
}
