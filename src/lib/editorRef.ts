import type { Editor } from '@tiptap/react'

let currentEditor: Editor | null = null

export function setEditor(e: Editor | null): void {
  currentEditor = e
}

export function getEditor(): Editor | null {
  return currentEditor
}
