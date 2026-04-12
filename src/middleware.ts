import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const token = await getToken({ req: request, secret })
  if (!token?.sub) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const authorUid = process.env.AUTHOR_UID?.trim()
  if (authorUid && token.sub !== authorUid) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
