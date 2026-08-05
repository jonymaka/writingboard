import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useDocStore } from '../../store/useDocStore'
import { useUiStore } from '../../store/useUiStore'
import { setEditor } from '../../lib/editorRef'
import { StickyHighlight } from '../../lib/stickyHighlightPlugin'
import { AnnotationMark, AnnotationRef } from '../../lib/annotationExtensions'
import { AiBubbleMenu } from './AiBubbleMenu'

export function Editor() {
  const docs = useDocStore((s) => s.docs)
  const activeId = useDocStore((s) => s.activeId)
  const updateContent = useDocStore((s) => s.updateContent)
  const undoHintAt = useUiStore((s) => s.undoHintAt)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const panelPinned = useUiStore((s) => s.panelPinned)
  const closePanel = useUiStore((s) => s.closePanel)
  const activeDoc = docs.find((d) => d.id === activeId)

  const [wordCount, setWordCount] = useState(0)
  const [showUndoHint, setShowUndoHint] = useState(false)
  const saveTimer = useRef<number | null>(null)
  const lastSavedRef = useRef('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: false }),
      StickyHighlight,
      AnnotationMark,
      AnnotationRef,
      Placeholder.configure({ placeholder: '落笔为墨，选中文字即可请 AI 朱批 …' }),
      CharacterCount,
    ],
    content: activeDoc?.content ?? '',
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      setWordCount(e.storage.characterCount.characters())
      if (html === lastSavedRef.current) return
      lastSavedRef.current = html
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        if (activeDoc) updateContent(activeDoc.id, html)
      }, 500)
    },
  })

  useEffect(() => {
    setEditor(editor)
  }, [editor])

  useEffect(() => {
    if (!editor || !activeDoc) return
    const current = editor.getHTML()
    if (current !== activeDoc.content) {
      editor.commands.setContent(activeDoc.content, false)
    }
    lastSavedRef.current = activeDoc.content
    setWordCount(editor.storage.characterCount.characters())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  useEffect(() => {
    if (!undoHintAt) return
    setShowUndoHint(true)
    const t = window.setTimeout(() => setShowUndoHint(false), 5000)
    return () => window.clearTimeout(t)
  }, [undoHintAt])

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [])

  if (!editor) return null

  return (
    <div
      className="flex h-full flex-col"
      onMouseDown={panelOpen && !panelPinned ? () => closePanel() : undefined}
    >
      <AiBubbleMenu editor={editor} />
      <div className="flex flex-1 items-stretch overflow-hidden">
        <span
          className="v-text hidden w-6 shrink-0 select-none items-center justify-center self-stretch text-[10px] lg:flex"
          style={{ color: 'var(--text-3)', opacity: 0.55 }}
        >
          文房 · 落笔为墨 · 朱批由 AI
        </span>
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="editor-sheet anim-reveal-2 mx-auto min-h-[calc(100vh-8rem)] px-9 py-7">
            <div className="sheet-rule" />
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      <footer
        className="anim-reveal-3 flex h-8 items-center justify-end gap-4 px-5 text-[11px]"
        style={{ color: 'var(--text-3)' }}
      >
        {showUndoHint && (
          <span className="font-editor" style={{ color: 'var(--highlight-text)' }}>
            朱批已落 · {navigator.platform.includes('Mac') ? '⌘Z' : 'Ctrl+Z'} 可撤
          </span>
        )}
        <span className="font-editor">{wordCount} 字</span>
      </footer>
    </div>
  )
}
