import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import TutorialActions from './_components/TutorialActions'

export const dynamic = 'force-dynamic'

export default async function AdminTutorialsPage() {
  const tutorials = await prisma.tutorial.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      _count: { select: { steps: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-1">教程管理</h1>
          <p className="text-sm text-stone-500">共 {tutorials.length} 个</p>
        </div>
        <Link
          href="/admin/tutorials/new"
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          新建教程
        </Link>
      </div>

      <div className="bg-white border border-stone-200">
        {tutorials.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-stone-300 block mb-3">school</span>
            <p className="text-stone-500 text-sm mb-4">暂无教程，创建第一个吧</p>
            <Link
              href="/admin/tutorials/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              新建教程
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
                  步骤数
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
              {tutorials.map((t) => (
                <tr key={t.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-[#1A1A1A] line-clamp-1">{t.title}</div>
                    <div className="text-xs text-stone-400 font-mono mt-0.5">/tutorial/{t.slug}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex text-xs px-2 py-0.5 font-medium ${
                        t.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {t.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-stone-500 hidden md:table-cell text-xs">
                    {t._count.steps} 步
                  </td>
                  <td className="px-3 py-3 text-stone-500 text-xs hidden lg:table-cell font-mono">
                    {formatDate((t.publishedAt ?? t.createdAt).toISOString())}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <TutorialActions tutorial={{ id: t.id, slug: t.slug }} />
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
