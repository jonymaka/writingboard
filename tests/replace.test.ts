import { describe, it, expect } from 'vitest'
import { normalizeOutput, buildHighlightContent } from '../src/hooks/useReplaceSelection'

describe('normalizeOutput', () => {
  it('trims leading and trailing newlines/whitespace', () => {
    expect(normalizeOutput('\n\n润色后的文字。\n\n')).toBe('润色后的文字。')
    expect(normalizeOutput('  文字  \n')).toBe('文字')
  })

  it('normalizes CRLF and collapses 3+ newlines', () => {
    expect(normalizeOutput('a\r\nb')).toBe('a\nb')
    expect(normalizeOutput('a\n\n\n\nb')).toBe('a\n\nb')
  })
})

describe('buildHighlightContent', () => {
  it('returns null for empty output', () => {
    expect(buildHighlightContent('')).toBeNull()
    expect(buildHighlightContent('   \n\n ')).toBeNull()
  })

  it('builds single inline highlighted text node for one line', () => {
    const content = buildHighlightContent('润色后的文字。')
    expect(content).toHaveLength(1)
    expect(content![0]).toEqual({
      type: 'text',
      text: '润色后的文字。',
      marks: [{ type: 'highlight' }],
    })
  })

  it('trims surrounding newlines and keeps single line as inline text', () => {
    const content = buildHighlightContent('\n\n润色后的文字。\n\n')
    expect(content).toHaveLength(1)
    expect((content![0] as { text: string }).text).toBe('润色后的文字。')
  })

  it('splits multi-line output into highlighted paragraphs', () => {
    const content = buildHighlightContent('第一段。\n\n第二段。\n第三段。')
    expect(content).toHaveLength(3)
    for (const node of content!) {
      expect(node).toMatchObject({ type: 'paragraph' })
      expect((node as { content: unknown[] }).content[0]).toMatchObject({
        type: 'text',
        marks: [{ type: 'highlight' }],
      })
    }
  })
})
