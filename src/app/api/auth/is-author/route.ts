import { NextResponse } from 'next/server'
import { getSession, sessionIsAuthor } from '@/lib/auth-helpers'

export async function GET() {
  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ isAuthor: false })
  }
  return NextResponse.json({ isAuthor: sessionIsAuthor(userId) })
}
