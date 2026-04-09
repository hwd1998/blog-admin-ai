import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About',
  description: 'About The Curator — an editorial journal of ideas, culture, and craft.',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      {/* Nav */}
      <nav className="flex items-center gap-2 text-xs text-secondary mb-10 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface">About</span>
      </nav>

      {/* Header */}
      <header className="mb-12 pb-10 border-b border-outline-variant">
        <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-3">
          About
        </p>
        <h1 className="font-serif text-4xl font-semibold text-on-surface leading-tight mb-4">
          The Curator
        </h1>
        <p className="text-secondary text-lg leading-relaxed font-light">
          An editorial journal dedicated to the careful selection of ideas worth writing about.
        </p>
      </header>

      {/* Content */}
      <div className="prose-custom">
        <h2>What Is This?</h2>
        <p>
          The Curator is a personal writing project — a space for long-form essays, cultural
          observations, and reflections on craft. Each piece is written with care and published
          only when it feels ready.
        </p>

        <blockquote>
          Curation is not collection. It is discernment applied at scale, the exercise of taste
          in service of others.
        </blockquote>

        <h2>The Editorial Approach</h2>
        <p>
          Rather than chasing publication frequency, this journal prizes depth over volume. A
          single well-considered essay published monthly is worth more than daily notes that
          dissipate into the feed.
        </p>
        <p>
          The topics vary — technology, culture, craft, process, books, ideas — but the
          approach remains consistent: primary research, original thinking, and writing that
          tries to say something true.
        </p>

        <h2>On the Design</h2>
        <p>
          The design borrows from editorial print traditions: serif headlines, generous white
          space, strong typographic hierarchy, and sharp corners. No decorative radius, no
          gradient buttons. Legibility first.
        </p>
        <p>
          The palette draws from warm neutrals and amber — the color of old paper and morning
          light through a window.
        </p>

        <h2>Archives &amp; Reading</h2>
        <p>
          All published articles are available in the <Link href="/">archive</Link>. They are
          organized by category and tagged by topic. Comments are welcome — thoughtful disagreement
          especially so.
        </p>
      </div>

      {/* Footer CTA */}
      <div className="mt-12 pt-8 border-t border-outline-variant">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to the archive
        </Link>
      </div>
    </div>
  )
}
