# 个人博客项目开发规格

## 技术栈

- **框架**: Next.js 15（App Router）
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **编辑器**: Tiptap（富文本，支持 Markdown）
- **数据库**: Supabase（PostgreSQL + Auth + Storage）
- **部署**: Vercel

---

## 项目结构

```
src/
├── app/
│   ├── layout.tsx               # 根布局（导航栏、全局样式）
│   ├── page.tsx                 # 首页（文章列表）
│   │
│   ├── articles/
│   │   └── [slug]/
│   │       └── page.tsx         # 文章详情页（SSG）
│   │
│   ├── categories/
│   │   └── [slug]/
│   │       └── page.tsx         # 分类页
│   │
│   ├── tags/
│   │   └── [slug]/
│   │       └── page.tsx         # 标签页
│   │
│   ├── about/
│   │   └── page.tsx             # 关于页
│   │
│   ├── login/
│   │   └── page.tsx             # 登录页
│   │
│   └── admin/                   # B端后台（需博主身份）
│       ├── layout.tsx           # 后台布局（侧边栏）
│       ├── page.tsx             # 数据概览
│       ├── articles/
│       │   ├── page.tsx         # 文章管理列表
│       │   ├── new/
│       │   │   └── page.tsx     # 新建文章
│       │   └── [id]/
│       │       └── page.tsx     # 编辑文章
│       ├── categories/
│       │   └── page.tsx         # 分类标签管理
│       ├── comments/
│       │   └── page.tsx         # 评论管理
│       └── media/
│           └── page.tsx         # 媒体库
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── AdminSidebar.tsx
│   ├── c/                       # C端组件
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleContent.tsx   # 富文本渲染
│   │   ├── TableOfContents.tsx  # 文章目录
│   │   ├── CommentList.tsx
│   │   ├── CommentForm.tsx
│   │   └── LikeButton.tsx       # 'use client'（含交互）
│   └── admin/                   # B端组件
│       ├── Editor.tsx           # Tiptap 编辑器（'use client'）
│       └── ImageUpload.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # 浏览器端客户端（Client Components 用）
│   │   └── server.ts            # 服务端客户端（Server Components 用）
│   └── utils.ts
│
├── hooks/                       # 客户端 hooks（'use client'）
│   ├── useAuth.ts
│   └── useComments.ts
│
├── types/
│   └── index.ts
│
└── middleware.ts                # 路由鉴权守卫
```

---

## 服务端 vs 客户端组件策略

| 场景 | 组件类型 | 原因 |
|------|----------|------|
| 文章列表、文章详情读取 | Server Component | SEO、性能，无需客户端 JS |
| 点赞、收藏按钮 | Client Component（`'use client'`） | 需要交互和状态 |
| 评论列表展示 | Server Component | 静态读取 |
| 评论提交表单 | Client Component | 需要表单交互 |
| 后台编辑器 | Client Component | Tiptap 依赖浏览器 API |
| 导航栏登录状态 | Client Component | 需要实时 Auth 状态 |

---

## 两个 Supabase 客户端

```typescript
// lib/supabase/client.ts（浏览器端）
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts（服务端）
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## 中间件鉴权守卫（middleware.ts）

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 访问 /admin/* 必须是博主
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user || user.id !== process.env.AUTHOR_UID) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

---

## 数据获取示例

```typescript
// app/page.tsx（首页，Server Component）
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, summary, created_at, view_count, article_tags(tags(name, slug))')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10)

  return <ArticleList articles={articles} />
}

// app/articles/[slug]/page.tsx（文章详情，SSG）
export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published')
  return articles?.map(({ slug }) => ({ slug })) ?? []
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select('title, summary')
    .eq('slug', params.slug)
    .single()
  return {
    title: article?.title,
    description: article?.summary,
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: article } = await supabase
    .from('articles')
    .select('*, article_tags(tags(*))')
    .eq('slug', params.slug)
    .single()

  await supabase.rpc('increment_view_count', { article_id: article.id })

  return <ArticleContent article={article} />
}
```

---

## 数据库 Schema（supabase/migrations/init.sql）

```sql
create extension if not exists "uuid-ossp";

create table articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  content text,
  summary text,
  cover_url text,
  status text default 'draft' check (status in ('draft', 'published')),
  view_count integer default 0,
  author_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table article_categories (
  article_id uuid references articles(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (article_id, category_id)
);

create table tags (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table article_tags (
  article_id uuid references articles(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

create table comments (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references articles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nickname text,
  content text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

create table likes (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references articles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (article_id, user_id)
);

create table favorites (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references articles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (article_id, user_id)
);

-- 阅读量函数
create or replace function increment_view_count(article_id uuid)
returns void as $$
  update articles set view_count = view_count + 1 where id = article_id;
$$ language sql;

-- updated_at 触发器
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger articles_updated_at
  before update on articles
  for each row execute function update_updated_at();

-- ============================================================
-- RLS（将 'YOUR_AUTHOR_UID' 替换为博主实际 user id）
-- ============================================================

alter table articles enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table article_categories enable row level security;
alter table article_tags enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table favorites enable row level security;

-- 文章
create policy "公开读取已发布文章" on articles for select using (status = 'published');
create policy "博主读取全部文章" on articles for select using (auth.uid() = 'YOUR_AUTHOR_UID'::uuid);
create policy "博主创建文章" on articles for insert with check (auth.uid() = 'YOUR_AUTHOR_UID'::uuid);
create policy "博主修改文章" on articles for update using (auth.uid() = 'YOUR_AUTHOR_UID'::uuid);
create policy "博主删除文章" on articles for delete using (auth.uid() = 'YOUR_AUTHOR_UID'::uuid);

-- 分类标签
create policy "公开读取分类" on categories for select using (true);
create policy "博主管理分类" on categories for all using (auth.uid() = 'YOUR_AUTHOR_UID'::uuid);
create policy "公开读取标签" on tags for select using (true);
create policy "博主管理标签" on tags for all using (auth.uid() = 'YOUR_AUTHOR_UID'::uuid);
create policy "公开读取文章分类" on article_categories for select using (true);
create policy "博主管理文章分类" on article_categories for all using (auth.uid() = 'YOUR_AUTHOR_UID'::uuid);
create policy "公开读取文章标签" on article_tags for select using (true);
create policy "博主管理文章标签" on article_tags for all using (auth.uid() = 'YOUR_AUTHOR_UID'::uuid);

-- 评论
create policy "公开读取已审核评论" on comments for select using (status = 'approved');
create policy "登录用户可发表评论" on comments for insert with check (auth.uid() is not null);
create policy "博主读取全部评论" on comments for select using (auth.uid() = 'YOUR_AUTHOR_UID'::uuid);
create policy "博主管理评论" on comments for all using (auth.uid() = 'YOUR_AUTHOR_UID'::uuid);

-- 点赞
create policy "公开读取点赞" on likes for select using (true);
create policy "登录用户可点赞" on likes for insert with check (auth.uid() is not null);
create policy "用户取消点赞" on likes for delete using (auth.uid() = user_id);

-- 收藏
create policy "用户读取自己收藏" on favorites for select using (auth.uid() = user_id);
create policy "登录用户可收藏" on favorites for insert with check (auth.uid() is not null);
create policy "用户取消收藏" on favorites for delete using (auth.uid() = user_id);

-- Storage（在 Dashboard > Storage 创建名为 "media" 的 public bucket）
create policy "公开读取媒体" on storage.objects for select using (bucket_id = 'media');
create policy "博主上传媒体" on storage.objects for insert
  with check (bucket_id = 'media' and auth.uid() = 'YOUR_AUTHOR_UID'::uuid);
create policy "博主删除媒体" on storage.objects for delete
  using (bucket_id = 'media' and auth.uid() = 'YOUR_AUTHOR_UID'::uuid);
```

---

## C 端页面功能

### 首页
- Server Component，SSR
- 文章列表：标题、摘要、标签、日期、阅读量，倒序排列
- 支持分类/标签筛选（URL 参数 `?category=` / `?tag=`）
- 分页，每页 10 篇

### 文章详情页
- SSG（`generateStaticParams` 构建时预渲染全部已发布文章）
- `generateMetadata` 自动生成 title / description / og 标签
- `next/image` 展示封面图
- 富文本 HTML 渲染，代码高亮
- 自动目录（h2/h3）
- 点赞、收藏（Client Component）
- 评论区：列表（Server Component）+ 提交（Client Component）

### 分类/标签页
- Server Component，展示该分类/标签下全部已发布文章

### 关于页
- 静态内容页

### 登录页
- Supabase Auth，邮箱 + 密码
- 登录后判断 uid：博主跳 `/admin`，普通用户跳首页

---

## B 端功能

> `middleware.ts` 守卫 `/admin/*`，非博主自动重定向首页

### 数据概览
- 总文章数、总阅读量、总评论数、待审核评论数
- 最近 5 篇文章快捷入口

### 文章管理
- 列表：标题、状态（草稿/已发布）、创建时间、操作（编辑/删除/切换状态）
- 编辑页：Tiptap 编辑器 + 右侧设置面板（slug、摘要、封面图、分类、标签）
- 草稿保存 / 发布两个操作

### 分类标签管理
- 分类和标签的增删改

### 评论管理
- 全部评论列表，支持审核通过 / 拒绝 / 删除

### 媒体库
- Supabase Storage 图片列表，支持上传、复制 URL、删除

---

## 环境变量（.env.local）

```
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon key
AUTHOR_UID=博主的Supabase用户ID
```

> `AUTHOR_UID` 不加 `NEXT_PUBLIC_` 前缀，仅在服务端 middleware 使用，不会暴露给浏览器。

---

## 初始化步骤

```bash
# 1. 创建项目
npx create-next-app@latest my-blog \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
cd my-blog

# 2. 安装依赖
npm install @supabase/supabase-js @supabase/ssr
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
npx shadcn@latest init

# 3. 推送数据库
npm install -g supabase
supabase login
supabase link --project-ref 你的项目ref
supabase db push
```
