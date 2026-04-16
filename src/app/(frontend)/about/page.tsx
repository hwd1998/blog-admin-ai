import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '关于',
  description: '关于 HWD BLOG — 记录真实用过的东西，写值得写下来的过程。',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <header className="mb-12 pb-10 border-b border-outline-variant">
        <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-3">
          关于
        </p>
        <h1 className="font-serif text-4xl font-semibold text-on-surface leading-tight mb-4">
          HWD BLOG
        </h1>
        <p className="text-secondary text-lg leading-relaxed font-light">
          记录真实用过的东西，写值得写下来的过程。
        </p>
      </header>

      <div className="prose-custom">
        <h2>这是什么</h2>
        <p>
          个人博客，没有固定主题，但有一个倾向：偏重过程而不是结论。不太想写「XX 工具值不值得用」这种终结性判断，更想写「我在用它做什么，遇到了什么，后来怎么想的」。
        </p>

        <h2>会写什么</h2>
        <p>
          AI 是目前花时间最多的方向——工具调研、使用心得、一些发现和踩坑。但不止于此，凡是自己真实接触过、觉得值得记录的事情，都可能出现在这里。
        </p>

        <h2>写给谁看</h2>
        <p>
          首先是给自己留档。如果刚好也对你有参考价值，那很好。如果有不同经历或看法，评论区随时欢迎。
        </p>

        <h2>去哪读</h2>
        <p>
          所有文章都在 <Link href="/">首页归档</Link>，可以按分类或标签筛选。
        </p>
      </div>

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