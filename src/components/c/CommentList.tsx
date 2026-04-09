import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

interface CommentListProps {
  articleId: string
}

export default async function CommentList({ articleId }: CommentListProps) {
  const supabase = await createClient()

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('article_id', articleId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (!comments || comments.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-secondary text-sm">No comments yet. Be the first to share your thoughts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {comments.map((comment, index) => (
        <div key={comment.id} className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 w-9 h-9 bg-surface-container-high border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-secondary">person</span>
          </div>

          {/* Comment body */}
          <div className="flex-1">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-sm font-medium text-on-surface">
                {comment.author_name?.trim() || `Reader ${String(index + 1).padStart(2, '0')}`}
              </span>
              <span className="font-mono text-xs text-secondary">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <p className="text-sm text-on-surface leading-relaxed">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
