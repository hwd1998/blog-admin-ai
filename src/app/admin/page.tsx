import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  // Fetch stats
  const [
    { count: totalArticles },
    { count: totalComments },
    { count: pendingComments },
    { data: articlesData },
    { data: recentComments },
  ] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('articles')
      .select('id, title, status, view_count, published_at, created_at, slug')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Calculate total views
  const totalViews = articlesData?.reduce((sum, a) => sum + (a.view_count ?? 0), 0) ?? 0

  const stats = [
    { label: '文章总数', value: totalArticles ?? 0, icon: 'article' },
    { label: '总阅读量', value: (totalViews).toLocaleString(), icon: 'visibility' },
    { label: '评论总数', value: totalComments ?? 0, icon: 'chat' },
    { label: '待审核', value: pendingComments ?? 0, icon: 'pending', urgent: (pendingComments ?? 0) > 0 },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">概览</h1>
        <p className="text-sm text-stone-500">欢迎回来</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`p-5 border ${
              stat.urgent
                ? 'bg-amber-50 border-amber-300'
                : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`material-symbols-outlined text-[22px] ${stat.urgent ? 'text-amber-600' : 'text-stone-400'}`}>
                {stat.icon}
              </span>
            </div>
            <div className={`text-3xl font-semibold mb-1 ${stat.urgent ? 'text-amber-700' : 'text-[#1A1A1A]'}`}>
              {stat.value}
            </div>
            <div className="text-xs text-stone-500 uppercase tracking-wider font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent articles */}
        <div className="xl:col-span-2">
          <div className="bg-white border border-stone-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-sm text-[#1A1A1A] uppercase tracking-wider">
                最近文章
              </h2>
              <Link
                href="/admin/articles"
                className="text-xs text-amber-700 hover:text-amber-900 transition-colors"
              >
                查看全部 →
              </Link>
            </div>

            {!articlesData || articlesData.length === 0 ? (
              <div className="p-6 text-sm text-stone-500 text-center">暂无文章</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">标题</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">状态</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">阅读量</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider hidden lg:table-cell">日期</th>
                  </tr>
                </thead>
                <tbody>
                  {articlesData.map((article) => (
                    <tr key={article.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="text-[#1A1A1A] hover:text-amber-700 font-medium line-clamp-1 transition-colors"
                        >
                          {article.title}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex text-xs px-2 py-0.5 font-medium ${
                          article.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {article.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-stone-500 hidden md:table-cell font-mono text-xs">
                        {article.view_count.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-stone-500 text-xs hidden lg:table-cell font-mono">
                        {formatDate(article.published_at ?? article.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent comments */}
        <div>
          <div className="bg-white border border-stone-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-sm text-[#1A1A1A] uppercase tracking-wider">
                最近评论
              </h2>
              <Link
                href="/admin/comments"
                className="text-xs text-amber-700 hover:text-amber-900 transition-colors"
              >
                查看全部 →
              </Link>
            </div>

            {!recentComments || recentComments.length === 0 ? (
              <div className="p-6 text-sm text-stone-500 text-center">暂无评论</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {recentComments.map((comment) => (
                  <div key={comment.id} className="px-5 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-1.5 py-0.5 font-medium ${
                        comment.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : comment.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {comment.status === 'approved' ? '已通过' : comment.status === 'rejected' ? '已拒绝' : '待审核'}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 line-clamp-2">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
