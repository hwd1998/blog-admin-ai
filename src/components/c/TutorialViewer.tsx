'use client'

import { useState, useEffect, useCallback } from 'react'

export interface TutorialStep {
  stepNumber: number
  title: string | null
  content: string
  imageUrl: string | null
}

interface TutorialViewerProps {
  steps: TutorialStep[]
}

export default function TutorialViewer({ steps }: TutorialViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const active = steps[activeIndex]
  const isFirst = activeIndex === 0
  const isLast = activeIndex === steps.length - 1
  const progressPct = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 100

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < steps.length) setActiveIndex(index)
    },
    [steps.length]
  )

  const openLightbox = () => { if (active.imageUrl) setLightboxOpen(true) }
  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxOpen, closeLightbox])

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxOpen])

  if (steps.length === 0) {
    return <div className="py-20 text-center text-secondary">暂无步骤内容。</div>
  }

  // ─── Step content card (shared between mobile & desktop) ─────────────────
  const StepCard = () => (
    <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      {/* ── Step title bar ── */}
      <div className="flex items-stretch">
        {/* Amber number block */}
        <div className="flex flex-col items-center justify-center px-4 py-3 lg:px-5 lg:py-5 bg-amber-500 text-white min-w-[60px] lg:min-w-[72px] shrink-0">
          <span className="font-mono text-[10px] tracking-widest uppercase opacity-75 mb-0.5">STEP</span>
          <span className="font-serif text-2xl lg:text-3xl font-bold leading-none">
            {String(active.stepNumber).padStart(2, '0')}
          </span>
        </div>

        {/* Title + meta */}
        <div className="flex flex-col justify-center px-4 py-3 lg:px-5 lg:py-4 bg-surface-container-low flex-1 min-w-0 border-b border-outline-variant">
          {active.title ? (
            <h2 className="font-serif text-base lg:text-xl font-semibold text-on-surface leading-snug">
              {active.title}
            </h2>
          ) : (
            <h2 className="font-serif text-base lg:text-xl font-semibold text-secondary leading-snug">
              步骤 {active.stepNumber}
            </h2>
          )}
          <p className="text-xs text-secondary font-mono mt-0.5">
            {activeIndex + 1} / {steps.length}
          </p>
        </div>
      </div>

      {/* ── Content body ── */}
      <div className="px-6 py-6 lg:px-8 lg:py-7">
        <div className="prose-custom" dangerouslySetInnerHTML={{ __html: active.content }} />
      </div>
    </div>
  )

  // ─── Screenshot button (shared) ───────────────────────────────────────────
  const Screenshot = ({ className = '' }: { className?: string }) =>
    active.imageUrl ? (
      <button
        type="button"
        onClick={openLightbox}
        className={`group relative border border-outline-variant overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${className}`}
        title="点击放大"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.imageUrl}
          alt={active.title ?? `步骤 ${active.stepNumber}`}
          className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          referrerPolicy="no-referrer"
        />
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
          <span className="material-symbols-outlined text-white text-[30px] drop-shadow-md">zoom_in</span>
        </span>
      </button>
    ) : null

  // ─── Lightbox (shared) ────────────────────────────────────────────────────
  const Lightbox = () =>
    lightboxOpen && active.imageUrl ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
        onClick={closeLightbox}
      >
        <div
          className="relative max-w-[90vw] max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.imageUrl}
            alt={active.title ?? `步骤 ${active.stepNumber}`}
            className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl rounded-lg"
            referrerPolicy="no-referrer"
          />
          {/* Step label */}
          <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-mono px-2.5 py-1 rounded-md">
            {String(active.stepNumber).padStart(2, '0')}{active.title ? ` — ${active.title}` : ''}
          </div>
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-stone-100 transition-colors"
            aria-label="关闭"
          >
            <span className="material-symbols-outlined text-[18px] text-stone-700">close</span>
          </button>
        </div>

        {/* Side arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1) }}
          disabled={isFirst}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1) }}
          disabled={isLast}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
        </button>

        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-xs font-mono">
          {activeIndex + 1} / {steps.length}
        </p>
      </div>
    ) : null

  return (
    <>
      {/* ════════════════════════════════════════
          MOBILE  (< lg)
      ════════════════════════════════════════ */}
      <div className="lg:hidden space-y-4">

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold tracking-widest uppercase text-secondary">进度</span>
            <span className="text-xs font-mono text-secondary">{activeIndex + 1} / {steps.length}</span>
          </div>
          <div className="h-1.5 bg-surface-container-high rounded-full w-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Horizontal step pills */}
        <div className="overflow-x-auto py-2 -mx-4 px-4">
          <div className="flex gap-2 w-max">
            {steps.map((step, index) => {
              const isActive = index === activeIndex
              const isDone = index < activeIndex
              return (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  title={step.title ?? `步骤 ${index + 1}`}
                  className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white ring-2 ring-amber-400 ring-offset-2'
                      : isDone
                      ? 'bg-green-500 text-white'
                      : 'bg-surface-container-high text-secondary hover:bg-surface-container-highest'
                  }`}
                >
                  {isDone
                    ? <span className="material-symbols-outlined text-[14px]">check</span>
                    : index + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <StepCard />

        {/* Screenshot */}
        {active.imageUrl && (
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-secondary mb-2">截图预览</p>
            <Screenshot className="w-full block" />
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => goTo(activeIndex - 1)}
            disabled={isFirst}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg border border-outline bg-white text-secondary text-sm font-medium hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            上一步
          </button>
          <button
            onClick={() => goTo(activeIndex + 1)}
            disabled={isLast}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            下一步
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {isLast && (
          <p className="text-center text-xs text-green-700 font-medium flex items-center justify-center gap-1.5 py-2 bg-green-50 rounded-lg border border-green-200">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            已完成全部步骤
          </p>
        )}
      </div>

      {/* ════════════════════════════════════════
          DESKTOP  (≥ lg)
      ════════════════════════════════════════ */}
      <div className="hidden lg:flex gap-8 items-start">

        {/* Left nav */}
        <aside className="w-52 shrink-0 sticky top-20">
          {/* Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold tracking-widest uppercase text-secondary">进度</span>
              <span className="text-xs font-mono text-secondary">{activeIndex + 1}/{steps.length}</span>
            </div>
            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <nav className="space-y-1">
            {steps.map((step, index) => {
              const isActive = index === activeIndex
              const isDone = index < activeIndex
              return (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 text-left border-l-2 transition-all group ${
                    isActive
                      ? 'border-amber-500 bg-amber-50'
                      : isDone
                      ? 'border-green-400 hover:bg-surface-container-low hover:border-green-500'
                      : 'border-transparent hover:bg-surface-container-low hover:border-outline-variant'
                  }`}
                >
                  <span
                    className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                      isActive
                        ? 'bg-amber-500 text-white'
                        : isDone
                        ? 'bg-green-500 text-white'
                        : 'bg-surface-container-high text-secondary group-hover:bg-outline-variant group-hover:text-on-surface'
                    }`}
                  >
                    {isDone
                      ? <span className="material-symbols-outlined text-[11px]">check</span>
                      : index + 1}
                  </span>
                  <span className={`text-xs leading-snug line-clamp-2 ${isActive ? 'text-on-surface font-medium' : 'text-secondary'}`}>
                    {step.title ?? `步骤 ${index + 1}`}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Center content */}
        <div className="flex-1 min-w-0">
          <StepCard />
        </div>

        {/* Right: screenshot + nav */}
        <aside className="w-60 shrink-0 sticky top-20 flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-secondary pb-2 border-b border-outline-variant">
            截图预览
          </p>

          {active.imageUrl ? (
            <Screenshot className="w-full block" />
          ) : (
            <div className="border border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center h-36 gap-2">
              <span className="material-symbols-outlined text-[28px] text-outline-variant">image</span>
              <span className="text-xs text-secondary">暂无截图</span>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => goTo(activeIndex + 1)}
              disabled={isLast}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              下一步
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button
              onClick={() => goTo(activeIndex - 1)}
              disabled={isFirst}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-outline bg-white text-secondary text-sm font-medium hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              上一步
            </button>
          </div>

          {isLast && (
            <p className="text-center text-xs text-green-700 font-medium pt-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 rounded-lg border border-green-200">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              已完成全部步骤
            </p>
          )}
        </aside>
      </div>

      <Lightbox />
    </>
  )
}
