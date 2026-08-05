import { describe, it, expect } from 'vitest'
import { htmlToMarkdown, markdownToHtml } from '../src/lib/export'

describe('export', () => {
  it('converts simple html to markdown', () => {
    const md = htmlToMarkdown('<h1>标题</h1><p>正文 <strong>加粗</strong></p>')
    expect(md).toContain('# 标题')
    expect(md).toContain('**加粗**')
    expect(md).toContain('正文')
  })

  it('converts markdown back to html', async () => {
    const html = await markdownToHtml('# 标题\n\n正文内容')
    expect(html).toContain('<h1>标题</h1>')
    expect(html).toContain('正文内容')
  })
})
