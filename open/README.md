# 开放 API 文档

供第三方系统调用的公开接口，统一前缀 `/api/open/`，使用 Bearer Token 认证。

---

## 认证流程

1. 调用登录接口获取 `token`
2. 后续请求在 Header 中携带：`Authorization: Bearer <token>`
3. Token 有效期 **30 天**，过期后重新登录

---

## 接口列表

### 1. 登录获取 Token

**`POST /api/open/auth/token`**

**Request Body（JSON）：**

| 字段       | 类型   | 必填 | 说明     |
| ---------- | ------ | ---- | -------- |
| `email`    | string | 是   | 登录邮箱 |
| `password` | string | 是   | 登录密码 |

**示例：**
```bash
curl -X POST http://39.105.200.95/api/open/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```

**成功响应（200）：**
```json
{
  "token": "eyJ...",
  "expires_at": "2026-05-12T00:00:00.000Z",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin"
  }
}
```

**失败响应：**
```json
{ "error": "Invalid credentials" }   // 401
{ "error": "email and password are required" }  // 400
```

---

### 2. 获取文章列表

**`GET /api/open/articles`**

**请求 Header：**
```
Authorization: Bearer <token>
```

**Query 参数：**

| 参数        | 类型   | 默认值 | 说明                         |
| ----------- | ------ | ------ | ---------------------------- |
| `page`      | number | `1`    | 页码                         |
| `page_size` | number | `10`   | 每页数量，最大 100           |
| `category`  | string | -      | 分类 slug 筛选（可选）       |
| `tag`       | string | -      | 标签 slug 筛选（可选）       |

**示例：**
```bash
curl https://39.105.200.95/api/open/articles?page=1&page_size=10 \
  -H "Authorization: Bearer eyJ..."
```

**成功响应（200）：**
```json
{
  "total": 42,
  "page": 1,
  "page_size": 10,
  "total_pages": 5,
  "articles": [
    {
      "id": "uuid",
      "title": "文章标题",
      "slug": "article-slug",
      "summary": "摘要",
      "cover_image_url": "https://...",
      "status": "published",
      "view_count": 100,
      "published_at": "2026-04-01T00:00:00.000Z",
      "created_at": "2026-04-01T00:00:00.000Z",
      "updated_at": "2026-04-01T00:00:00.000Z",
      "author": { "id": "uuid", "name": "Admin" },
      "categories": [{ "id": "uuid", "name": "技术", "slug": "tech" }],
      "tags": [{ "id": "uuid", "name": "Next.js", "slug": "nextjs" }]
    }
  ]
}
```

> 注：列表接口不返回文章正文 `content`，详情接口才包含。

---

### 3. 获取文章详情

**`GET /api/open/articles/:slug`**

**请求 Header：**
```
Authorization: Bearer <token>
```

**示例：**
```bash
curl https://39.105.200.95/api/open/articles/my-article-slug \
  -H "Authorization: Bearer eyJ..."
```

**成功响应（200）：**
```json
{
  "article": {
    "id": "uuid",
    "title": "文章标题",
    "slug": "my-article-slug",
    "summary": "摘要",
    "content": "<p>正文内容...</p>",
    "content_format": "html",
    "cover_image_url": "https://...",
    "status": "published",
    "view_count": 100,
    "published_at": "2026-04-01T00:00:00.000Z",
    "created_at": "2026-04-01T00:00:00.000Z",
    "updated_at": "2026-04-01T00:00:00.000Z",
    "author": { "id": "uuid", "name": "Admin" },
    "categories": [{ "id": "uuid", "name": "技术", "slug": "tech" }],
    "tags": [{ "id": "uuid", "name": "Next.js", "slug": "nextjs" }]
  }
}
```

**失败响应：**
```json
{ "error": "Article not found" }  // 404
{ "error": "Unauthorized" }       // 401
```

---

## 错误码说明

| HTTP 状态码 | 含义                       |
| ----------- | -------------------------- |
| 400         | 请求参数错误               |
| 401         | 未认证或 Token 无效/过期   |
| 404         | 资源不存在                 |
| 500         | 服务器内部错误             |
