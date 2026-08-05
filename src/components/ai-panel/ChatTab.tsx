import { useRef, useState } from 'react'
import { extractPlainText, type ChatMessage } from '../../lib/prompts'
import { useAiRequest } from '../../hooks/useAiRequest'
import { useDocStore } from '../../store/useDocStore'
import { getEditor } from '../../lib/editorRef'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

export function ChatTab() {
  const activeDoc = useDocStore((s) => s.docs.find((d) => d.id === s.activeId))
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const { run, abort, running } = useAiRequest()
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    window.setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, 30)
  }

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const docText = activeDoc ? extractPlainText(activeDoc.content) : ''
    const system: ChatMessage = {
      role: 'system',
      content:
        '你是一名专业的中文写作助手，以下是用户正在编辑的文章全文：\n' +
        `${docText}\n\n` +
        '用户会围绕这篇文章提问、修改或提出写作建议。直接给出有用的回答；如需修改文本，直接给出修改后的内容。',
    }
    const history: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))
    const requestMsgs: ChatMessage[] = [
      system,
      ...history,
      { role: 'user', content: trimmed },
    ]

    setMessages([...messages, { role: 'user', content: trimmed }, { role: 'assistant', content: '' }])
    setInput('')
    scrollToBottom()

    void run(requestMsgs, {
      onDelta: (full) => {
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: full }
          return next
        })
        scrollToBottom()
      },
      onDone: () => scrollToBottom(),
      onError: (err) => {
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: `⚠️ ${err.message}` }
          return next
        })
      },
    })
  }

  const insertToEnd = (text: string) => {
    const editor = getEditor()
    if (!editor) return
    editor.chain().focus().insertContent(`\n\n${text}`).run()
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="py-10 text-center font-editor text-[13px]" style={{ color: 'var(--text-3)' }}>
            与 AI 对语
            <br />
            围绕此文讨教、润改，皆可
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className="max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[13px] leading-relaxed"
              style={
                m.role === 'user'
                  ? { background: 'var(--accent)', color: 'var(--accent-text)', boxShadow: '0 2px 8px -3px var(--ink-glow)' }
                  : { background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'var(--font-editor)', border: '1px solid var(--border)' }
              }
            >
              {m.content || '…'}
              {m.role === 'assistant' && m.content && (
                <div className="mt-1.5 flex gap-1.5" style={{ fontFamily: 'var(--font-ui)' }}>
                  <button
                    onClick={() => insertToEnd(m.content)}
                    className="rounded px-1.5 py-0.5 text-[10.5px] hover:opacity-70"
                    style={{ background: 'var(--surface-3)' }}
                  >
                    归入文末
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(m.content)}
                    className="rounded px-1.5 py-0.5 text-[10.5px] hover:opacity-70"
                    style={{ background: 'var(--surface-3)' }}
                  >
                    誊录
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t p-3" style={{ borderColor: 'var(--border)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) send(input)
          }}
          placeholder={running ? 'AI 落笔中 …' : '垂询 AI，Enter 发出'}
          className="flex-1 rounded-lg border px-3 py-2 font-editor text-[13.5px] outline-none focus:border-[var(--accent)]"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
          disabled={running}
        />
        {running ? (
          <button onClick={abort} className="btn-accent rounded-lg px-3 py-2 text-[13px]">
            ⏹
          </button>
        ) : (
          <button
            onClick={() => send(input)}
            className="btn-accent rounded-lg px-3 py-2 text-[13px]"
            disabled={!input.trim()}
          >
            落笔
          </button>
        )}
      </div>
    </div>
  )
}
