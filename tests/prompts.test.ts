import { describe, it, expect } from 'vitest'
import {
  buildSelectionMessages,
  buildFullDocMessages,
  extractPlainText,
} from '../src/lib/prompts'

describe('buildSelectionMessages', () => {
  it('returns system + user with original text', () => {
    const msgs = buildSelectionMessages('polish', '你好世界')
    expect(msgs).toHaveLength(2)
    expect(msgs[0].role).toBe('system')
    expect(msgs[1].role).toBe('user')
    expect(msgs[1].content).toContain('你好世界')
    expect(msgs[1].content).toContain('润色')
  })

  it.each([
    ['polish', '润色'],
    ['rewrite', '改写'],
    ['continue', '续写'],
    ['expand', '扩写'],
    ['shorten', '缩写'],
    ['fix', '纠正'],
  ] as const)('action %s includes expected instruction', (action, keyword) => {
    const msgs = buildSelectionMessages(action, '测试文本')
    expect(msgs[1].content).toContain(keyword)
  })

  it('style action injects target style', () => {
    const msgs = buildSelectionMessages('style', '测试', { styleTarget: '文艺' })
    expect(msgs[1].content).toContain('文艺')
  })

  it('custom action uses custom instruction', () => {
    const msgs = buildSelectionMessages('custom', '测试', { customInstruction: '改成反问句' })
    expect(msgs[1].content).toContain('改成反问句')
  })

  it('custom action falls back to generic instruction when empty', () => {
    const msgs = buildSelectionMessages('custom', '测试', { customInstruction: '  ' })
    expect(msgs[1].content).toContain('请处理【选中文字】')
  })

  it('includes surrounding context when provided', () => {
    const msgs = buildSelectionMessages('polish', '选中段', { before: '前文内容', after: '后文内容' })
    const content = msgs[1].content
    expect(content).toContain('【上文】')
    expect(content).toContain('前文内容')
    expect(content).toContain('【下文】')
    expect(content).toContain('后文内容')
    expect(content).toContain('【选中文字】')
    expect(content).toContain('只修改【选中文字】部分')
  })

  it('omits context sections when absent', () => {
    const msgs = buildSelectionMessages('polish', '仅此一段')
    expect(msgs[1].content).not.toContain('【上文】')
    expect(msgs[1].content).not.toContain('【下文】')
  })

  it('selection instructions reference the marked segment with context note', () => {
    for (const action of ['polish', 'rewrite', 'expand', 'shorten', 'style', 'fix'] as const) {
      const msgs = buildSelectionMessages(action, 'x', { styleTarget: '简洁' })
      expect(msgs[1].content).toContain('【选中文字】')
      expect(msgs[1].content).toContain('结合前后文语境')
    }
  })
})

describe('buildFullDocMessages', () => {
  it.each(['summary', 'outline', 'check'] as const)('includes article for %s', (action) => {
    const msgs = buildFullDocMessages(action, '全文内容')
    expect(msgs[1].content).toContain('全文内容')
  })
})

describe('extractPlainText', () => {
  it('strips html tags', () => {
    expect(extractPlainText('<p>hello <b>world</b></p>')).toBe('hello world')
  })
})
