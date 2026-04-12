import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import CommentActions from './_components/CommentActions'

export const dynamic = 'force-dynamic'

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    include: {
      article: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pending = comments.filter((c) => c.status === 'pending').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">评论管理</h1>
          <p className="text-sm text-stone-500">
            共 {comments.length} 条
            {pending > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium">
                {pending} 条待审核
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white border border-stone-200">
        {comments.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-stone-300 block mb-3">chat</span>
            <p className="text-stone-500 text-sm">暂无评论</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  内容
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">
                  所属文章
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider hidden lg:table-cell">
                  日期
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-stone-700 text-sm line-clamp-2 max-w-xs">{comment.content}</p>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    {comment.article ? (
                      <a
                        href={`/articles/${comment.article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-700 hover:text-amber-900 hover:underline line-clamp-1 max-w-[180px] block"
                      >
                        {comment.article.title}
                      </a>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex text-xs px-2 py-0.5 font-medium ${
                        comment.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : comment.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {comment.status === 'approved'
                        ? '已通过'
                        : comment.status === 'rejected'
                        ? '已拒绝'
                        : '待审核'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-stone-500 text-xs hidden lg:table-cell font-mono">
                    {formatDate(comment.createdAt.toISOString())}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <CommentActions comment={comment} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
