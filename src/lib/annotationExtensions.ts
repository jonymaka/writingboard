import { Mark, Node } from '@tiptap/core'

/** 旁批标记：给选中文字打上蓝色波浪下划线。 */
export const AnnotationMark = Mark.create({
  name: 'annotationMark',
  parseHTML() {
    return [{ tag: 'span[data-annotation]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { 'data-annotation': '', class: 'annotation-mark', ...HTMLAttributes }, 0]
  },
})

/** 旁批序号：原子内联节点，渲染为圆圈数字（数字经 CSS ::before 展示，不进入正文文本）。 */
export const AnnotationRef = Node.create({
  name: 'annotationRef',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,
  addAttributes() {
    return {
      number: {
        default: 1,
        parseHTML: (el) => Number((el as HTMLElement).getAttribute('data-n')) || 1,
        renderHTML: (attrs) => ({ 'data-n': String(attrs.number) }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-annotation-ref]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { 'data-annotation-ref': '', class: 'annotation-ref', ...HTMLAttributes }]
  },
  renderText() {
    return ''
  },
})
