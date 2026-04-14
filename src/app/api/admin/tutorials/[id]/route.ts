import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSessionUser } from '@/lib/auth-helpers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const tutorial = await prisma.tutorial.findUnique({ where: { id } })
  if (!tutorial) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [tutCats, steps] = await Promise.all([
    prisma.tutorialCategory.findMany({ where: { tutorialId: id }, select: { categoryId: true } }),
    prisma.tutorialStep.findMany({
      where: { tutorialId: id },
      orderBy: { stepNumber: 'asc' },
    }),
  ])

  return NextResponse.json({
    tutorial: {
      id: tutorial.id,
      title: tutorial.title,
      slug: tutorial.slug,
      summary: tutorial.summary,
      cover_image_url: tutorial.coverImageUrl,
      status: tutorial.status,
      created_at: tutorial.createdAt.toISOString(),
      updated_at: tutorial.updatedAt.toISOString(),
      published_at: tutorial.publishedAt?.toISOString() ?? null,
    },
    categoryIds: tutCats.map((r) => r.categoryId),
    steps: steps.map((s) => ({
      id: s.id,
      step_number: s.stepNumber,
      title: s.title,
      content: s.content,
      content_format: s.contentFormat,
      image_url: s.imageUrl,
    })),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = (await request.json()) as {
    title?: string
    slug?: string
    summary?: string | null
    cover_image_url?: string | null
    status?: 'draft' | 'published'
    published_at?: string | null
    categoryIds?: string[]
    steps?: Array<{
      id?: string
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
  const coverUrl =
    typeof body.cover_image_url === 'string'
      ? body.cover_image_url.trim() || null
      : null

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.tutorial.findUnique({ where: { id }, select: { publishedAt: true } })
      const publishedAt =
        status === 'published'
          ? body.published_at
            ? new Date(body.published_at)
            : existing?.publishedAt ?? new Date()
          : null

      await tx.tutorial.update({
        where: { id },
        data: {
          title: body.title!.trim(),
          slug: body.slug!.trim(),
          summary: body.summary?.trim() || null,
          coverImageUrl: coverUrl,
          status,
          publishedAt,
        },
      })

      // Replace all steps
      await tx.tutorialStep.deleteMany({ where: { tutorialId: id } })
      const steps = body.steps ?? []
      if (steps.length) {
        await tx.tutorialStep.createMany({
          data: steps.map((s) => ({
            tutorialId: id,
            stepNumber: s.step_number,
            title: s.title?.trim() || null,
            content: s.content ?? '',
            contentFormat: s.content_format === 'markdown' ? 'markdown' : 'html',
            imageUrl: s.image_url?.trim() || null,
          })),
        })
      }

      // Replace categories
      await tx.tutorialCategory.deleteMany({ where: { tutorialId: id } })
      const catIds = body.categoryIds ?? []
      if (catIds.length) {
        await tx.tutorialCategory.createMany({
          data: catIds.map((categoryId) => ({ tutorialId: id, categoryId })),
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const tutorial = await prisma.tutorial.findUnique({ where: { id }, select: { id: true } })
  if (!tutorial) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.tutorial.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
