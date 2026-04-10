import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '关于',
  description: '关于 HWD BLOG — 个人写作空间，记录想法、文化与创作。',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      {/* Nav */}
      <nav className="flex items-center gap-2 text-xs text-secondary mb-10 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">首页</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface">关于</span>
      </nav>

      {/* Header */}
      <header className="mb-12 pb-10 border-b border-outline-variant">
        <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-3">
          关于
        </p>
        <h1 className="font-serif text-4xl font-semibold text-on-surface leading-tight mb-4">
          HWD BLOG
        </h1>
        <p className="text-secondary text-lg leading-relaxed font-light">
          一个认真对待「写什么、怎么写」的个人写作空间。
        </p>
      </header>

      {/* Content */}
      <div className="prose-custom">
        <h2>这是什么？</h2>
        <p>
          HWD BLOG 是个人写作项目，用来放长文随笔、文化观察和对技艺、过程的思考。每篇都会认真写完，只在觉得可以见人时再发布。
        </p>

        <blockquote>
          策展不是囤积，而是在规模上运用判断力，用品味为他人服务。
        </blockquote>

        <h2>写作方式</h2>
        <p>
          不追求发稿频率，更看重深度而不是数量。一个月一篇想透的文章，胜过每天在信息流里消失的短句。
        </p>
        <p>
          题目会变——技术、文化、技艺、流程、书、想法——但方法一致：尽量基于一手材料，有自己的判断，写自己相信为真的东西。
        </p>

        <h2>关于设计</h2>
        <p>
          视觉参考编辑排版传统：衬线标题、留白、清晰的字阶和直角。没有装饰性圆角和渐变按钮，阅读优先。
        </p>
        <p>
          配色偏暖中性色与琥珀色，像旧纸和清晨窗边的光。
        </p>

        <h2>归档与阅读</h2>
        <p>
          已发布的文章都在 <Link href="/">首页归档</Link> 中，可按分类浏览，也可按标签检索。欢迎评论，有理有据的不同意见尤其欢迎。
        </p>
      </div>

      {/* Footer CTA */}
      <div className="mt-12 pt-8 border-t border-outline-variant">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          返回文章列表
        </Link>
      </div>
    </div>
  )
}
