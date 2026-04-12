import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { encode } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const ok = await compare(password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const expiresIn = 30 * 24 * 60 * 60 // 30天（秒）
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn

  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
      exp: expiresAt,
    },
    secret: process.env.NEXTAUTH_SECRET!,
  })

  return NextResponse.json({
    token,
    expires_at: new Date(expiresAt * 1000).toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  })
}
