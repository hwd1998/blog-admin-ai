import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import ArticleActions from './_components/ArticleActions'

export const dynamic = 'force-dynamic'

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      viewCount: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">文章管理</h1>
          <p className="text-sm text-stone-500">共 {articles.length} 篇</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          新建文章
        </Link>
      </div>

      <div className="bg-white border border-stone-200">
        {articles.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-stone-300 block mb-3">article</span>
            <p className="text-stone-500 text-sm mb-4">暂无文章，创建第一篇吧</p>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              新建文章
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">
                  阅读量
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
              {articles.map((article) => (
                <tr key={article.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-[#1A1A1A] line-clamp-1">{article.title}</div>
                    <div className="text-xs text-stone-400 font-mono mt-0.5">/articles/{article.slug}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex text-xs px-2 py-0.5 font-medium ${
                        article.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {article.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-stone-500 hidden md:table-cell font-mono text-xs">
                    {article.viewCount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-stone-500 text-xs hidden lg:table-cell font-mono">
                    {formatDate(
                      (article.publishedAt ?? article.createdAt).toISOString()
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ArticleActions article={article} />
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
