import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** 与 middleware 的 AUTHOR_UID 一致，用于前台导航是否显示「后台」（不暴露 UID） */
export async function GET() {
  const authorUid = process.env.AUTHOR_UID?.trim()
  if (!authorUid) {
    return NextResponse.json({ isAuthor: false })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return NextResponse.json({
    isAuthor: Boolean(user && user.id === authorUid),
  })
}
