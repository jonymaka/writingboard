import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'

function highlightText(text: string): unknown {
  return { type: 'text', text, marks: [{ type: 'highlight' }] }
}

/** 清洗模型输出：统一换行符、压缩连续空行、去掉首尾空白，避免 `\n` 在 pre-wrap 编辑器里渲染成意外换行。 */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 把 AI 输出构造成可插入的 ProseMirror 节点：
 * - 单段文本 → 内联文本节点（原地替换）
 * - 多段文本 → 拆分段落节点，`\n\n` 变为真正的段落分隔
 */
export function buildHighlightContent(text: string): unknown[] | null {
  const t = normalizeOutput(text)
  if (!t) return null
  if (!t.includes('\n')) {
    return [highlightText(t)]
  }
  return t
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ type: 'paragraph', content: [highlightText(s)] }))
}

export function useReplaceSelection(editor: Editor | null) {
  return useCallback(
    (text: string) => {
      if (!editor) return
      const content = buildHighlightContent(text)
      if (!content) return
      editor.chain().focus().deleteSelection().insertContent(content).run()
    },
    [editor],
  )
}

export function useInsertAfterSelection(editor: Editor | null) {
  return useCallback(
    (text: string) => {
      if (!editor) return
      const content = buildHighlightContent(text)
      if (!content) return
      const to = editor.state.selection.to
      const insert =
        content.every((c) => (c as { type?: string }).type === 'paragraph')
          ? content
          : [{ type: 'paragraph', content }]
      editor.chain().focus().insertContentAt(to, insert).run()
    },
    [editor],
  )
}

export function useInsertToDoc(editor: Editor | null) {
  const append = useCallback(
    (text: string) => {
      if (!editor) return
      editor.chain().focus().insertContent(`\n\n${text}`).run()
    },
    [editor],
  )
  const prepend = useCallback(
    (text: string) => {
      if (!editor) return
      editor.chain().focus().insertContentAt(0, `${text}\n\n`).run()
    },
    [editor],
  )
  return { append, prepend }
}
