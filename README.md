# HWD BLOG

基于 Next.js 15 + Prisma + MySQL 构建的全栈个人博客系统，支持富文本/Markdown 双编辑器、评论审核、点赞收藏等功能。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15.1（App Router） |
| UI | React 19 + Tailwind CSS 3 |
| 语言 | TypeScript 5 |
| ORM | Prisma 6 |
| 数据库 | MySQL |
| 认证 | NextAuth v4（JWT 策略） |
| 编辑器 | Tiptap v2（富文本）+ marked（Markdown） |
| 密码加密 | bcryptjs |

---

## 目录结构

```
├── prisma/
│   ├── schema.prisma          # 数据模型定义
│   └── seed.ts                # 初始化作者账号脚本
│
├── public/                    # 静态资源
│
├── open/                      # 项目文档/规格（保留）
│
├── src/
│   ├── app/
│   │   ├── (frontend)/        # 前台页面（访客可见）
│   │   │   ├── page.tsx           # 首页：文章列表，支持分类/标签过滤
│   │   │   ├── about/             # 关于页面
│   │   │   ├── login/             # 登录页
│   │   │   ├── articles/[slug]/   # 文章详情页
│   │   │   ├── categories/[slug]/ # 按分类筛选文章
│   │   │   ├── tags/[slug]/       # 按标签筛选文章
│   │   │   └── layout.tsx         # 前台布局（含顶部导航栏）
│   │   │
│   │   ├── admin/             # 后台管理（需登录）
│   │   │   ├── page.tsx           # 仪表板：统计数据 + 最近内容
│   │   │   ├── layout.tsx         # 后台布局（含侧边栏）
│   │   │   ├── articles/          # 文章管理：列表、新建、编辑
│   │   │   ├── comments/          # 评论管理：审核、删除
│   │   │   ├── categories/        # 分类与标签管理
│   │   │   └── media/             # 媒体文件管理
│   │   │
│   │   ├── api/
│   │   │   ├── auth/              # NextAuth 处理 + 身份验证
│   │   │   ├── admin/             # 管理员 API（文章、分类、标签、评论）
│   │   │   ├── open/              # 公开 API（无需认证）
│   │   │   ├── comments/          # 评论提交与获取
│   │   │   ├── article-interactions/ # 点赞/收藏操作
│   │   │   └── upload/            # 文件上传
│   │   │
│   │   ├── layout.tsx         # 根布局（SessionProvider、全局字体）
│   │   └── globals.css        # 全局样式
│   │
│   ├── components/
│   │   ├── c/                 # 内容组件
│   │   │   ├── ArticleCard.tsx    # 文章卡片（列表项）
│   │   │   ├── ArticleContent.tsx # 文章内容渲染
│   │   │   ├── TableOfContents.tsx# 文章目录
│   │   │   ├── CommentForm.tsx    # 评论表单
│   │   │   ├── CommentList.tsx    # 评论列表
│   │   │   └── LikeButton.tsx     # 点赞/收藏按钮
│   │   ├── admin/             # 后台专用组件
│   │   │   ├── Editor.tsx         # Tiptap 富文本编辑器
│   │   │   ├── MarkdownEditor.tsx # Markdown 编辑器
│   │   │   └── ImageUpload.tsx    # 图片上传
│   │   ├── layout/            # 布局组件
│   │   │   ├── Navbar.tsx         # 顶部导航栏
│   │   │   └── AdminSidebar.tsx   # 后台侧边栏
│   │   └── providers/
│   │       └── SessionProvider.tsx# NextAuth 会话 Provider
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 客户端单例
│   │   ├── auth-options.ts    # NextAuth 配置（Credentials Provider）
│   │   ├── auth-helpers.ts    # 认证辅助函数
│   │   ├── utils.ts           # 工具函数（日期格式化、slug 生成等）
│   │   ├── articleHtml.ts     # 文章内容格式转换
│   │   ├── revalidateArticleRoutes.ts # ISR 路由重验证
│   │   ├── data/
│   │   │   └── article-queries.ts # 服务端数据库查询
│   │   └── mappers/
│   │       └── article.ts     # DB 模型 → API 响应 DTO 转换
│   │
│   ├── hooks/
│   │   ├── useAuth.ts         # 认证相关 Hook
│   │   └── useComments.ts     # 评论相关 Hook
│   │
│   ├── types/
│   │   ├── index.ts           # 主要数据类型（Article、Category 等）
│   │   └── next-auth.d.ts     # NextAuth Session 类型扩展
│   │
│   └── middleware.ts          # 路由保护中间件（/admin 需登录）
│
├── .env                       # 环境变量（不提交 git）
├── next.config.ts             # Next.js 配置
├── tailwind.config.ts         # Tailwind 主题配置
└── package.json
```

---

## 数据模型

```
User ──< Article ──< ArticleCategory >── Category
                 ──< ArticleTag     >── Tag
                 ──< Comment
                 ──< Like
                 ──< Favorite
```

| 表 | 说明 |
|----|------|
| `users` | 用户账号，存储邮箱和加密密码 |
| `articles` | 文章，含标题、slug、正文、状态（draft/published）、阅读量 |
| `categories` | 分类，每篇文章可属于多个分类 |
| `tags` | 标签，每篇文章可有多个标签 |
| `article_categories` | 文章-分类多对多联结表 |
| `article_tags` | 文章-标签多对多联结表 |
| `comments` | 评论，含审核状态（pending/approved/rejected） |
| `likes` | 点赞记录，用户+文章唯一约束 |
| `favorites` | 收藏记录，用户+文章唯一约束 |

---

## 业务逻辑

### 前台（访客/读者）

1. **首页**：展示已发布文章列表，支持按分类或标签过滤，分页加载
2. **文章详情**：渲染正文（HTML 或 Markdown），自动累加阅读量，侧边栏显示目录
3. **评论**：仅显示已审核（approved）的评论；登录后可提交评论，提交后进入待审核状态
4. **点赞/收藏**：需登录，数据库唯一约束防止重复操作

### 后台（博主）

1. **仪表板**：文章数、总阅读量、评论数、待审核数统计，最近文章和评论速览
2. **文章编辑**：支持富文本（Tiptap）和 Markdown 两种编辑器，可设置封面、摘要、分类、标签、发布状态
3. **评论审核**：批准或拒绝待审核评论，已批准评论对访客可见
4. **分类/标签管理**：增删分类和标签，Slug 自动生成
5. **ISR 重验证**：文章发布/编辑后自动触发相关页面缓存更新

### 认证流程

```
登录页 → NextAuth Credentials Provider
       → 查询数据库用户 → bcryptjs 验证密码
       → 生成 JWT Token（30 天有效）→ 写入 HTTP-Only Cookie
       → 跳转 /admin

每次请求 /admin/* → middleware.ts 验证 JWT → 无效则跳转 /login
```

---

## 环境变量

```env
# 数据库连接（Prisma 专用）
DATABASE_URL="mysql://user:password@localhost:3306/blog_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# 初始作者账号（用于 prisma db seed）
AUTHOR_EMAIL="you@example.com"
AUTHOR_PASSWORD="your-password"
```

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env   # 编辑 .env 填入数据库等信息

# 3. 初始化数据库
npx prisma db push

# 4. 创建初始作者账号
npx tsx prisma/seed.ts

# 5. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`，前台博客首页；`/login` 登录后进入 `/admin` 后台。

---

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npx prisma db push` | 同步数据库 schema |
| `npx prisma db push --force-reset` | 重置数据库（清空所有数据） |
| `npx tsx prisma/seed.ts` | 创建初始作者账号 |
| `npx prisma studio` | 可视化数据库管理界面 |
