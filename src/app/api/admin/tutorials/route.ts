import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSessionUser } from '@/lib/auth-helpers'

export async function GET() {
  const user = await requireSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tutorials = await prisma.tutorial.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
      _count: { select: { steps: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    tutorials: tutorials.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      status: t.status,
      stepCount: t._count.steps,
      createdAt: t.createdAt.toISOString(),
    })),
  })
}

export async function POST(request: Request) {
  const user = await requireSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as {
    title?: string
    slug?: string
    summary?: string | null
    cover_image_url?: string | null
    status?: 'draft' | 'published'
    published_at?: string | null
    categoryIds?: string[]
    steps?: Array<{
      step_number: number
      title?: string | null
      content?: string
      content_format?: string
      image_url?: string | null
    }>
  }

  if (!body.title?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: 'title and slug required' }, { status: 400 })
  }

  const status = body.status === 'published' ? 'published' : 'draft'
  const publishedAt =
    status === 'published'
      ? body.published_at ? new Date(body.published_at) : new Date()
      : null

  const coverUrl =
    typeof body.cover_image_url === 'string'
      ? body.cover_image_url.trim() || null
      : null

  try {
    const tutorial = await prisma.$transaction(async (tx) => {
      const t = await tx.tutorial.create({
        data: {
          title: body.title!.trim(),
          slug: body.slug!.trim(),
          summary: body.summary?.trim() || null,
          coverImageUrl: coverUrl,
          status,
          authorId: user.id,
          publishedAt,
        },
      })

      const steps = body.steps ?? []
      if (steps.length) {
        await tx.tutorialStep.createMany({
          data: steps.map((s) => ({
            tutorialId: t.id,
            stepNumber: s.step_number,
            title: s.title?.trim() || null,
            content: s.content ?? '',
            contentFormat: s.content_format === 'markdown' ? 'markdown' : 'html',
            imageUrl: s.image_url?.trim() || null,
          })),
        })
      }

      const catIds = body.categoryIds ?? []
      if (catIds.length) {
        await tx.tutorialCategory.createMany({
          data: catIds.map((categoryId) => ({ tutorialId: t.id, categoryId })),
        })
      }

      return t
    })

    return NextResponse.json({ tutorial: { id: tutorial.id } })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Create failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
