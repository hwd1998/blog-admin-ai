import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '教程',
  description: '步骤式教程合集',
}

export default async function TutorialListPage() {
  const tutorials = await prisma.tutorial.findMany({
    where: { status: 'published' },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      coverImageUrl: true,
      publishedAt: true,
      createdAt: true,
      _count: { select: { steps: true } },
      tutorialCategories: {
        select: { category: { select: { id: true, name: true, slug: true } } },
      },
    },
    orderBy: { publishedAt: 'desc' },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Page header */}
      <header className="mb-10 pb-8 border-b border-outline-variant">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-[28px] text-amber-500">school</span>
          <p className="text-xs font-semibold tracking-widest uppercase text-secondary">Tutorial</p>
        </div>
        <h1 className="font-serif text-4xl font-semibold text-on-surface leading-tight mb-3">
          步骤式教程
        </h1>
        <p className="text-secondary text-base leading-relaxed">
          每篇教程拆分为若干步骤，配合截图，按步索骥。
        </p>
      </header>

      {tutorials.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-outline-variant">
          <span className="material-symbols-outlined text-[48px] text-outline-variant block mb-3">school</span>
          <p className="text-secondary text-sm">暂无已发布的教程。</p>
        </div>
      ) : (
        <div className="space-y-0">
          {tutorials.map((t, i) => {
            const categories = t.tutorialCategories.map((tc) => tc.category)
            const date = t.publishedAt ?? t.createdAt
            return (
              <article
                key={t.id}
                className={`flex gap-6 py-7 border-b border-outline-variant ${i === 0 ? 'border-t border-outline-variant' : ''}`}
              >
                {/* Step count badge */}
                <div className="flex-shrink-0 hidden sm:flex flex-col items-center justify-start pt-1 w-12 text-center">
                  <span className="font-serif text-2xl font-semibold text-outline-variant leading-none">
                    {String(t._count.steps).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-secondary tracking-wide mt-0.5">步</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1.5">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/categories/${cat.slug}`}
                          className="text-xs font-semibold tracking-widest uppercase text-primary hover:text-primary-container transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  <Link href={`/tutorial/${t.slug}`}>
                    <h2 className="font-serif text-xl font-semibold text-on-surface hover:text-primary transition-colors leading-snug mb-2">
                      {t.title}
                    </h2>
                  </Link>

                  {t.summary && (
                    <p className="text-secondary text-sm leading-relaxed mb-3 line-clamp-2">
                      {t.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-secondary font-mono">
                    <span>{formatDate(date.toISOString())}</span>
                  </div>
                </div>

                {/* Cover */}
                {t.coverImageUrl && (
                  <Link
                    href={`/tutorial/${t.slug}`}
                    className="flex-shrink-0 hidden sm:block w-28 h-20 overflow-hidden border border-outline-variant hover:opacity-90 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.coverImageUrl}
                      alt={t.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
