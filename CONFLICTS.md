# Conflicts & Design Decisions

This document records conflicts found between the spec, UI demos, and implementation decisions.

---

## 1. AUTHOR_UID — Server-only vs Client-side Login Redirect

**Conflict**: The spec defines `AUTHOR_UID` as a server-only env var (no `NEXT_PUBLIC_` prefix), but the login page is a Client Component that needs to decide where to redirect after sign-in.

**Decision**: The login page redirects all authenticated users to `/admin`. The middleware (`src/middleware.ts`) performs the `AUTHOR_UID` check server-side and redirects non-authors back to `/`. This is the correct security pattern — client-side checks are advisory only. The Navbar also uses `NEXT_PUBLIC_AUTHOR_UID` (an additional env var that can be set to the same value) to conditionally show the Admin link.

---

## 2. "Scheduled" Article Status

**Conflict**: The UI demo (`b_overview.html`) shows a "Scheduled" status badge on articles. The database schema spec only defines `draft | published`.

**Decision**: Not implementing "Scheduled" status. The DB `CHECK` constraint is `status IN ('draft', 'published')`. Adding a third state would require a background job or cron to auto-publish, which is outside the project scope.

---

## 3. Comment Author Display

**Conflict**: The spec shows comments with author names, but Supabase auth doesn't store a display name by default. The `auth.users` table isn't directly queryable from client-side RLS policies without a profile table.

**Decision**: Comments display as "Reader 01", "Reader 02", etc. (sequential numbering). A `profiles` table can be added later to store display names. This avoids exposing email addresses publicly.

---

## 4. shadcn/ui Not Installed

**Conflict**: The spec mentions shadcn/ui but the UI demos show a fully custom design system with 0px border radius and custom color tokens inconsistent with shadcn defaults.

**Decision**: shadcn/ui is listed as a dependency concept but not installed as a package. All components use raw Tailwind CSS classes matching the editorial aesthetic. The custom design tokens (primary, surface, outline, etc.) are implemented directly in `tailwind.config.ts`. This avoids style conflicts with shadcn's opinionated defaults.

---

## 5. Border Radius Override Strategy

**Conflict**: The design spec requires 0px border radius everywhere, but Tailwind's default `rounded-*` utilities produce non-zero values.

**Decision**: In `tailwind.config.ts`, all border radius values (DEFAULT, sm, md, lg, xl, 2xl, 3xl) are set to `0px`. The `full` variant retains `9999px` for pill-shaped elements (e.g., tag chips if needed). Additionally, `globals.css` has a `* { border-radius: 0 !important; }` rule with an override for `.rounded-full`.

---

## 6. Article View Count Increment

**Conflict**: Incrementing view count from a Server Component during SSG/ISR would not actually run on every request.

**Decision**: The `increment_view_count` RPC is called as a fire-and-forget from the article detail page. With `revalidate = 3600`, the view count will increment at most once per ISR cycle per server instance. For accurate real-time view counts, a separate API route or client-side call on mount could be used. Current implementation is a pragmatic balance of performance vs accuracy.

---

## 7. Image Optimization for Cover Images

**Conflict**: UI demos reference external Google/Unsplash URLs. The spec says to use `next/image` with Supabase Storage URLs.

**Decision**: `next/image` is used for cover images in the article detail page with `width={900}` and `height={450}`. The `ArticleCard` component uses a standard `<img>` tag for thumbnails since the dimensions are variable and SSG optimization of many thumbnails would increase build time significantly. The Supabase hostname wildcard (`*.supabase.co`) is added to `next.config.ts` remotePatterns.

---

## 8. Tiptap CodeBlockLowlight Import

**Conflict**: The `lowlight` package v3 changed its API. The import must use `createLowlight` from `lowlight` rather than the older `lowlight/core` pattern.

**Decision**: Using `import { common, createLowlight } from 'lowlight'` as per lowlight v3 API.

---

## 9. Admin Layout Overwrites Root Layout Navbar

**Conflict**: The root `layout.tsx` renders the `<Navbar>` for all routes including `/admin/*`. The admin panel uses its own `AdminSidebar` and has a different visual design.

**Decision**: The admin layout (`src/app/admin/layout.tsx`) renders without the top navbar by using `pt-0` on the main content (the `<main>` wrapper from root layout has `pt-14`). The admin sidebar includes its own branding. The `<body>` padding from root layout applies but the admin area has `min-h-screen bg-[#F5F5F3]` which covers the full viewport. A future improvement would be to use route groups to exclude the navbar from admin routes entirely.

---

## 10. generateStaticParams Requires Build-time Supabase Credentials

**Conflict**: `generateStaticParams` runs at build time (Vercel build), requiring `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to be set as build environment variables in Vercel.

**Decision**: All dynamic routes use `export const revalidate = 3600` for ISR fallback. If Supabase credentials are unavailable at build time, pages will be rendered on-demand and cached. Document in deployment instructions that Supabase env vars must be available during Vercel builds.
