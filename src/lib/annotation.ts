import type { Editor } from '@tiptap/react'
import type { EditorState, Transaction } from '@tiptap/pm/state'

/**
 * 构造删除某条旁批的事务：移除序号节点前的蓝色波浪标记，并删除序号节点。
 * 返回 null 表示文档中找不到对应序号的旁批。
 */
export function buildRemoveAnnotationTr(state: EditorState, number: number): Transaction | null {
  const markType = state.schema.marks.annotationMark
  const refType = state.schema.nodes.annotationRef
  let refPos = -1
  state.doc.descendants((node, pos) => {
    if (refPos !== -1) return false
    if (node.type === refType && node.attrs.number === number) {
      refPos = pos
      return false
    }
    return true
  })
  if (refPos < 0) return null

  let start = refPos
  for (;;) {
    const $p = state.doc.resolve(start)
    const before = $p.nodeBefore
    if (!before || !before.isText) break
    if (!before.marks.some((m) => m.type === markType)) break
    start -= before.nodeSize
  }

  const tr = state.tr
  if (start < refPos) tr.removeMark(start, refPos, markType)
  tr.delete(refPos, refPos + 1)
  return tr
}

export function removeAnnotationFromDoc(editor: Editor, number: number): void {
  const tr = buildRemoveAnnotationTr(editor.state, number)
  if (tr) editor.view.dispatch(tr)
}
