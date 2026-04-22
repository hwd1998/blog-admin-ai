import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function getSession() {
  return getServerSession(authOptions)
}

/** 博主：与 middleware 规则一致 */
export function sessionIsAuthor(userId: string): boolean {
  const authorUid = process.env.AUTHOR_UID?.trim()
  if (!authorUid) return false
  return userId === authorUid
}

export async function requireSessionUser() {
  const session = await getSession()
  const id = session?.user?.id
  if (!id) return null
  return { id, email: session.user.email, name: session.user.name }
}

export async function requireAuthorSession() {
  const user = await requireSessionUser()
  if (!user) return null
  if (!sessionIsAuthor(user.id)) return null
  return user
}
