import { decode } from 'next-auth/jwt'

export async function verifyOpenApiToken(request: Request) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const token = auth.slice(7)
  try {
    const payload = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET!,
    })
    if (!payload?.sub) return null
    // 检查是否过期
    const exp = payload.exp as number | undefined
    if (exp && exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
