export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export type SelectionAction =
  | 'polish'
  | 'rewrite'
  | 'continue'
  | 'expand'
  | 'shorten'
  | 'style'
  | 'fix'
  | 'custom'

export type FullDocAction = 'summary' | 'outline' | 'check'

export const STYLE_TARGETS = ['口语化', '正式书面', '文艺', '简洁', '幽默'] as const

const SYSTEM_PROMPT =
  '你是一名专业的中文写作助手，擅长润色、改写、续写、扩写、缩写、纠错和风格转换。' +
  '你的输出必须只包含正文内容本身：不加任何解释、不写"好的/以下是……"之类的开头、不使用引号包裹、不包含 Markdown 代码块标记。' +
  '对选中文字的操作，直接返回处理后的结果文本；若涉及段落，保留合理的分段结构。'

export interface SelectionOptions {
  customInstruction?: string
  styleTarget?: string
  before?: string
  after?: string
}

function selectionInstruction(action: SelectionAction, custom?: string, styleTarget?: string): string {
  const ctx = '结合前后文语境，保持与上下文衔接自然、语感连贯。'
  switch (action) {
    case 'polish':
      return `请润色【选中文字】：优化表达流畅度、用词精准度，保持原意和原有结构不变。${ctx}`
    case 'rewrite':
      return `请改写【选中文字】：换一种表达方式重写，信息不变，语气自然。${ctx}`
    case 'continue':
      return '请顺着【选中文字】的文意继续向下自然续写一段，与前后文风格保持一致，只返回续写部分。'
    case 'expand':
      return `请扩写【选中文字】：补充细节、论据或例子，使内容更充实，保持主题一致。${ctx}`
    case 'shorten':
      return `请缩写【选中文字】：压缩并提炼核心信息，保留原意，更加精炼。${ctx}`
    case 'style':
      return `请将【选中文字】转换成「${styleTarget}」的风格，保持信息不变。${ctx}`
    case 'fix':
      return `请纠正【选中文字】的错别字、语法和标点错误，直接返回修正后的完整文本。${ctx}`
    case 'custom':
      return custom && custom.trim() ? custom.trim() : '请处理【选中文字】。'
  }
}

export function buildSelectionMessages(
  action: SelectionAction,
  text: string,
  opts?: SelectionOptions,
): ChatMessage[] {
  const instruction = selectionInstruction(action, opts?.customInstruction, opts?.styleTarget)
  const parts = [instruction]
  if (opts?.before) parts.push(`\n\n【上文】\n${opts.before}`)
  parts.push(`\n\n【选中文字】\n${text}`)
  if (opts?.after) parts.push(`\n\n【下文】\n${opts.after}`)
  if (opts?.before || opts?.after) {
    parts.push('\n\n只修改【选中文字】部分，其余内容不得改动，也不要重复输出上下文。')
  }
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: parts.join('') },
  ]
}

export function buildFullDocMessages(action: FullDocAction, doc: string): ChatMessage[] {
  const instruction =
    action === 'summary'
      ? '请为以下文章生成一段简洁的全文摘要（200 字以内），直接输出摘要内容。'
      : action === 'outline'
        ? '请为以下文章生成一个结构清晰的大纲，使用"一、二、三"编号 + 每节要点，直接输出大纲内容。'
        : '请检查以下文章的错别字、语法和标点错误。输出格式：每行一条「原句 → 修改建议」，如无问题输出"未发现问题"。'
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `${instruction}\n\n【文章】\n${doc}` },
  ]
}

export function extractPlainText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent ?? ''
}
