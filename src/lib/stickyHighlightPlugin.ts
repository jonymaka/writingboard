import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state'

export const stickyHighlightKey = new PluginKey('stickyHighlightFix')

/**
 * 批注（highlight mark）只由 AI 生成，用户不会手动添加。
 * 当折叠光标处的活动标记（storedMarks 或光标位置推导）包含 highlight 时，
 * 一律将其从 storedMarks 中剔除，防止批注格式在回车、续写、点击边界后“粘”到后续输入上。
 */
export function stickyHighlightPlugin(): Plugin {
  return new Plugin({
    key: stickyHighlightKey,
    appendTransaction: (
      _transactions: readonly Transaction[],
      _oldState: EditorState,
      newState: EditorState,
    ): Transaction | null => {
      const { selection, storedMarks } = newState
      if (!selection.empty) return null
      const highlight = newState.schema.marks.highlight
      if (!highlight) return null
      const active = storedMarks ?? selection.$from.marks()
      if (!active.some((m) => m.type === highlight)) return null
      const next = active.filter((m) => m.type !== highlight)
      return newState.tr.setStoredMarks(next)
    },
  })
}

export const StickyHighlight = Extension.create({
  name: 'stickyHighlightFix',
  addProseMirrorPlugins() {
    return [stickyHighlightPlugin()]
  },
})
