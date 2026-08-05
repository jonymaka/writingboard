import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { AnnotationMark, AnnotationRef } from '../src/lib/annotationExtensions'
import { removeAnnotationFromDoc, buildRemoveAnnotationTr } from '../src/lib/annotation'

function makeEditor(content: string): Editor {
  return new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, AnnotationMark, AnnotationRef],
    content,
  })
}

describe('annotation document helpers', () => {
  it('applies wavy mark + ref node, then removes both by number', () => {
    const editor = makeEditor('<p>北冥有鱼，其名为鲲。</p>')
    const from = 1
    const to = from + 4 // 「北冥有鱼」
    editor
      .chain()
      .setTextSelection({ from, to })
      .setMark('annotationMark')
      .insertContentAt(to, { type: 'annotationRef', attrs: { number: 1 } })
      .run()

    const html = editor.getHTML()
    expect(html).toContain('annotation-mark')
    expect(html).toContain('data-annotation-ref')
    expect(html).toContain('data-n="1"')
    expect(html).toContain('北冥有鱼')
    // 序号节点不进正文文本
    expect(editor.getText()).toBe('北冥有鱼，其名为鲲。')

    removeAnnotationFromDoc(editor, 1)
    expect(editor.getHTML()).toBe('<p>北冥有鱼，其名为鲲。</p>')
  })

  it('returns null when no ref with that number exists', () => {
    const editor = makeEditor('<p>测试文字。</p>')
    expect(buildRemoveAnnotationTr(editor.state, 9)).toBeNull()
  })

  it('removes only the matching numbered annotation when multiple exist', () => {
    const editor = makeEditor('<p>北冥有鱼，化而为鸟。</p>')
    const chain = editor.chain().setTextSelection({ from: 1, to: 5 }).setMark('annotationMark')
    chain.insertContentAt(5, { type: 'annotationRef', attrs: { number: 1 } })
    chain.setTextSelection({ from: 7, to: 11 }).setMark('annotationMark')
    chain.insertContentAt(11, { type: 'annotationRef', attrs: { number: 2 } })
    chain.run()

    expect(editor.getHTML().match(/data-annotation-ref/g)).toHaveLength(2)

    removeAnnotationFromDoc(editor, 1)
    const html = editor.getHTML()
    expect(html.match(/data-annotation-ref/g)).toHaveLength(1)
    expect(html).toContain('data-n="2"')
    expect(html).not.toContain('data-n="1"')
    expect(editor.getText()).toBe('北冥有鱼，化而为鸟。')
  })
})
