-- 正文存储格式：html = 富文本（Tiptap HTML），markdown = Markdown 源码
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS content_format TEXT NOT NULL DEFAULT 'html'
CHECK (content_format IN ('html', 'markdown'));

COMMENT ON COLUMN articles.content_format IS 'html: Tiptap HTML body; markdown: Markdown source';
