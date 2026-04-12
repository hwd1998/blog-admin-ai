import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

interface CommentListProps {
  articleId: string
}

export default async function CommentList({ articleId }: CommentListProps) {
  const comments = await prisma.comment.findMany({
    where: { articleId, status: 'approved' },
    orderBy: { createdAt: 'asc' },
  })

  if (!comments || comments.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-secondary text-sm">还没有评论，来抢沙发吧。</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {comments.map((comment, index) => (
        <div key={comment.id} className="flex gap-4">
          <div className="flex-shrink-0 w-9 h-9 bg-surface-container-high border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-secondary">person</span>
          </div>

          <div className="flex-1">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-sm font-medium text-on-surface">
                {comment.authorName?.trim() || `读者 ${String(index + 1).padStart(2, '0')}`}
              </span>
              <span className="font-mono text-xs text-secondary">
                {formatDate(comment.createdAt.toISOString())}
              </span>
            </div>
            <p className="text-sm text-on-surface leading-relaxed">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
