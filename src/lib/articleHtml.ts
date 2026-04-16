import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import type { ArticleContentFormat } from '@/types'

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img', 'figure', 'figcaption', 'video', 'source',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'details', 'summary', 'mark', 'kbd', 'sup', 'sub',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'id'],
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height', 'loading'],
    'video': ['src', 'controls', 'width', 'height'],
    'source': ['src', 'type'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan'],
    'code': ['class'],
    'pre': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
}

/** 将数据库中的正文转为可插入页面的 HTML（markdown 则解析，html 则原样），并净化防止 XSS */
export function articleBodyToDisplayHtml(
  content: string,
  format: ArticleContentFormat | null | undefined
): string {
  const raw = format === 'markdown'
    ? (() => {
        const src = content?.trim() ?? ''
        if (!src) return ''
        return marked.parse(src, { async: false }) as string
      })()
    : (content ?? '')

  return sanitizeHtml(raw, sanitizeOptions)
}
