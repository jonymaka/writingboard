import { describe, it, expect, beforeEach } from 'vitest'
import { useAnnotationStore } from '../src/store/useAnnotationStore'

describe('useAnnotationStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAnnotationStore.setState({ byDoc: {} })
  })

  it('adds annotations per doc with incrementing numbers', () => {
    const a1 = useAnnotationStore.getState().add('doc1', { text: '北冥有鱼', before: '', after: '', note: '大物也。' })
    const a2 = useAnnotationStore.getState().add('doc1', { text: '化而为鸟', before: '', after: '', note: '变也。' })
    useAnnotationStore.getState().add('doc2', { text: '其名为鹏', before: '', after: '', note: '名也。' })

    expect(a1.number).toBe(1)
    expect(a2.number).toBe(2)
    expect(useAnnotationStore.getState().byDoc['doc1']).toHaveLength(2)
    expect(useAnnotationStore.getState().byDoc['doc2']).toHaveLength(1)
  })

  it('does not reuse numbers after removal', () => {
    const a1 = useAnnotationStore.getState().add('doc1', { text: '一', before: '', after: '', note: 'n1' })
    const a2 = useAnnotationStore.getState().add('doc1', { text: '二', before: '', after: '', note: 'n2' })
    useAnnotationStore.getState().remove('doc1', a1.id)
    const a3 = useAnnotationStore.getState().add('doc1', { text: '三', before: '', after: '', note: 'n3' })
    expect(a3.number).toBe(3)
    expect(a2.number).toBe(2)
  })

  it('persists annotations to localStorage', () => {
    useAnnotationStore.getState().add('doc1', { text: '鲲', before: '', after: '', note: '大鱼也。' })
    const raw = JSON.parse(localStorage.getItem('writingboard:annotations') ?? '{}') as Record<
      string,
      Array<{ note: string }>
    >
    expect(raw['doc1']).toHaveLength(1)
    expect(raw['doc1'][0].note).toBe('大鱼也。')
  })

  it('clears all annotations for a doc', () => {
    useAnnotationStore.getState().add('doc1', { text: '一', before: '', after: '', note: '' })
    useAnnotationStore.getState().clearDoc('doc1')
    expect(useAnnotationStore.getState().byDoc['doc1']).toBeUndefined()
  })
})
