import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthorSession } from '@/lib/auth-helpers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json()) as { status?: string }
  if (!body.status) {
    return NextResponse.json({ error: 'status required' }, { status: 400 })
  }

  await prisma.comment.update({
    where: { id },
    data: { status: body.status },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuthorSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await prisma.comment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
