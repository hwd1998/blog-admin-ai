'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEffect, useCallback } from 'react'
import { marked } from 'marked'
import ImageUpload from './ImageUpload'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

const lowlight = createLowlight(common)

interface EditorProps {
  content: string
  onChange: (html: string) => void
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  icon: string
}

function ToolbarButton({ onClick, active, disabled, title, icon }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      disabled={disabled}
      title={title}
      className={`p-1.5 transition-colors ${
        active
          ? 'bg-surface-container-high text-on-surface'
          : 'text-secondary hover:text-on-surface hover:bg-surface-container'
      } disabled:opacity-40`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  )
}

export default function Editor({ content, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full border border-outline-variant',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Begin writing your article...\n\nTip: You can paste Markdown directly!',
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'hljs',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update content from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  // Markdown paste support
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom

    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain')
      if (!text) return
      const looksLikeMarkdown = /^#{1,6}\s|^\*\*[\s\S]+\*\*|^[-*+]\s|^\d+\.\s|^>\s|^```|^\|.+\|/.test(text.trimStart())
      if (!looksLikeMarkdown) return
      e.preventDefault()
      const html = marked.parse(text) as string
      editor.commands.insertContent(html)
    }

    dom.addEventListener('paste', handlePaste)
    return () => dom.removeEventListener('paste', handlePaste)
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const handleImageUpload = useCallback((url: string) => {
    if (!editor) return
    editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  const insertTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="border border-outline-variant bg-surface-container-lowest">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-outline-variant bg-surface-container-low flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
          icon="format_bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
          icon="format_italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
          icon="format_strikethrough"
        />

        <div className="w-px h-5 bg-outline-variant mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
          icon="title"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
          icon="text_fields"
        />

        <div className="w-px h-5 bg-outline-variant mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
          icon="format_list_bulleted"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
          icon="format_list_numbered"
        />

        <div className="w-px h-5 bg-outline-variant mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
          icon="format_quote"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
          icon="code"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
          icon="terminal"
        />

        <div className="w-px h-5 bg-outline-variant mx-1" />

        {/* Table button */}
        <ToolbarButton
          onClick={insertTable}
          active={editor.isActive('table')}
          title="Insert Table"
          icon="table"
        />

        <div className="w-px h-5 bg-outline-variant mx-1" />

        <ToolbarButton
          onClick={setLink}
          active={editor.isActive('link')}
          title="Insert Link"
          icon="link"
        />

        <div className="ml-1">
          <ImageUpload onUpload={handleImageUpload} label="Insert Image" />
        </div>

        <div className="w-px h-5 bg-outline-variant mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
          icon="horizontal_rule"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
          icon="undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
          icon="redo"
        />
      </div>

      {/* Editor content */}
      <div className="tiptap-editor min-h-[400px] cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>

      {/* Word count */}
      <div className="px-4 py-2 border-t border-outline-variant bg-surface-container-low">
        <span className="text-xs text-secondary">
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length} characters
          {' · '}
          支持粘贴 Markdown
        </span>
      </div>
    </div>
  )
}
