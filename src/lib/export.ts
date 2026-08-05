import TurndownService from 'turndown'
import { marked } from 'marked'

let turndown: TurndownService | null = null

function getTurndown(): TurndownService {
  if (!turndown) {
    turndown = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    })
    turndown.remove(['script', 'style', 'meta', 'link'])
  }
  return turndown
}

export function htmlToMarkdown(html: string): string {
  return getTurndown().turndown(html)
}

export async function markdownToHtml(md: string): Promise<string> {
  const html = await marked.parse(md, { async: false, breaks: true, gfm: true })
  return typeof html === 'string' ? html : String(html)
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'))
    reader.readAsText(file)
  })
}
