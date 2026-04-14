import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { articleBodyToDisplayHtml } from '@/lib/articleHtml'
import TutorialViewer from '@/components/c/TutorialViewer'
import { formatDate } from '@/lib/utils'
import type { ArticleContentFormat } from '@/types'

export const revalidate = 3600

interface TutorialPageProps {
  params: Promise<{ slug: string }>
}

async function getTutorial(slug: string) {
  return prisma.tutorial.findFirst({
    where: { slug, status: 'published' },
    include: {
      steps: { orderBy: { stepNumber: 'asc' } },
      tutorialCategories: { include: { category: true } },
    },
  })
}

export async function generateMetadata({ params }: TutorialPageProps): Promise<Metadata> {
  const { slug } = await params
  const tutorial = await getTutorial(slug)
  if (!tutorial) return { title: '教程未找到' }
  return {
    title: tutorial.title,
    description: tutorial.summary ?? undefined,
    openGraph: {
      title: tutorial.title,
      description: tutorial.summary ?? undefined,
      images: tutorial.coverImageUrl ? [tutorial.coverImageUrl] : [],
    },
  }
}

export default async function TutorialPage({ params }: TutorialPageProps) {
  const { slug } = await params
  const tutorial = await getTutorial(slug)
  if (!tutorial) notFound()

  const categories = tutorial.tutorialCategories.map((tc) => tc.category)

  const steps = tutorial.steps.map((s) => ({
    stepNumber: s.stepNumber,
    title: s.title,
    content: articleBodyToDisplayHtml(s.content, s.contentFormat as ArticleContentFormat),
    imageUrl: s.imageUrl,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-secondary mb-8 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">首页</Link>
        <span className="text-outline-variant">/</span>
        <Link href="/tutorial" className="hover:text-primary transition-colors">教程</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface truncate max-w-xs">{tutorial.title}</span>
      </nav>

      {/* Header card */}
      <header className="mb-10 border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {/* Amber accent top bar */}
        <div className="h-1 bg-amber-500 w-full" />

        <div className="px-8 py-7 bg-white">
          <div className="flex items-start gap-6">
            {/* Tutorial badge — desktop only */}
            <div className="flex-shrink-0 hidden lg:flex flex-col items-center gap-1.5 pt-1">
              <span className="material-symbols-outlined text-[40px] text-amber-500">school</span>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-secondary">Tutorial</span>
            </div>

            <div className="flex-1 min-w-0">
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
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

              <h1 className="font-serif text-3xl md:text-4xl font-semibold leading-tight text-on-surface mb-3">
                {tutorial.title}
              </h1>

              {tutorial.summary && (
                <p className="text-secondary text-base leading-relaxed mb-4 font-light">
                  {tutorial.summary}
                </p>
              )}

              <div className="flex items-center gap-5 flex-wrap text-xs text-secondary font-mono">
                {tutorial.publishedAt && (
                  <span>{formatDate(tutorial.publishedAt.toISOString())}</span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                  {tutorial.steps.length} 个步骤
                </span>
              </div>
            </div>

            {/* Cover image thumbnail — desktop only */}
            {tutorial.coverImageUrl && (
              <div className="flex-shrink-0 hidden lg:block w-36 h-24 overflow-hidden border border-outline-variant">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tutorial.coverImageUrl}
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Viewer */}
      <TutorialViewer steps={steps} />
    </div>
  )
}
