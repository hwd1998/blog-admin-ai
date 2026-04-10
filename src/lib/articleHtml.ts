import { marked } from 'marked'
import type { ArticleContentFormat } from '@/types'

/** 将数据库中的正文转为可插入页面的 HTML（markdown 则解析，html 则原样） */
export function articleBodyToDisplayHtml(
  content: string,
  format: ArticleContentFormat | null | undefined
): string {
  if (format === 'markdown') {
    const src = content?.trim() ?? ''
    if (!src) return ''
    return marked.parse(src, { async: false }) as string
  }
  return content ?? ''
}
