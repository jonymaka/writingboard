import { useState } from 'react'
import { buildFullDocMessages, extractPlainText } from '../../lib/prompts'
import { useAiRequest } from '../../hooks/useAiRequest'
import { useDocStore } from '../../store/useDocStore'
import { getEditor } from '../../lib/editorRef'

export function SummaryTab() {
  const activeDoc = useDocStore((s) => s.docs.find((d) => d.id === s.activeId))
  const { run, abort, running } = useAiRequest()
  const [result, setResult] = useState<{ kind: 'summary' | 'outline'; text: string } | null>(null)
  const [error, setError] = useState('')

  const generate = (kind: 'summary' | 'outline') => {
    if (!activeDoc) return
    const doc = extractPlainText(activeDoc.content)
    if (!doc.trim()) {
      setError('当前文章为空，请先输入内容')
      setResult(null)
      return
    }
    setError('')
    setResult({ kind, text: '' })
    void run(buildFullDocMessages(kind, doc), {
      onDelta: (full) => setResult({ kind, text: full }),
      onDone: () => undefined,
      onError: (err) => setError(err.message),
    })
  }

  const insert = (pos: 'start' | 'end') => {
    if (!result?.text) return
    const editor = getEditor()
    if (!editor) return
    if (pos === 'start') {
      editor.chain().focus().insertContentAt(0, `${result.text}\n\n`).run()
    } else {
      editor.chain().focus().insertContent(`\n\n${result.text}`).run()
    }
  }

  return (
    <div className="flex h-full flex-col px-4 py-3">
      <div className="flex gap-2">
        <button
          onClick={() => generate('summary')}
          disabled={running}
          className="btn-accent flex-1 rounded-lg py-2 font-display text-[13px] tracking-wide"
        >
          {running && result?.kind === 'summary' ? '拟题中 …' : '撮要'}
        </button>
        <button
          onClick={() => generate('outline')}
          disabled={running}
          className="btn-accent flex-1 rounded-lg py-2 font-display text-[13px] tracking-wide"
        >
          {running && result?.kind === 'outline' ? '拟纲中 …' : '提纲'}
        </button>
        {running && (
          <button onClick={abort} className="chip rounded-lg px-3 py-2 text-[13px]">
            ⏹
          </button>
        )}
      </div>

      <div className="mt-3 flex-1 overflow-y-auto">
        {error && (
          <div
            className="rounded-lg p-3 text-[12.5px]"
            style={{ background: 'var(--accent-soft)', color: 'var(--danger)' }}
          >
            {error}
          </div>
        )}
        {result ? (
          <div
            className="whitespace-pre-wrap rounded-lg border p-3 font-editor text-[13.5px] leading-relaxed"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
          >
            {result.text || 'AI 拟笔中 …'}
            {result.text && !running && (
              <div className="mt-2 flex gap-1.5" style={{ fontFamily: 'var(--font-ui)' }}>
                <button onClick={() => insert('start')} className="btn-accent rounded px-2 py-1 text-[11.5px]">
                  冠于文首
                </button>
                <button onClick={() => insert('end')} className="btn-accent rounded px-2 py-1 text-[11.5px]">
                  缀于文末
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(result.text)}
                  className="chip rounded px-2 py-1 text-[11.5px]"
                >
                  誊录
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-10 text-center font-editor text-[13px]" style={{ color: 'var(--text-3)' }}>
            撮要或提纲全文
            <br />
            成稿后可一键冠首、缀尾
          </div>
        )}
      </div>
    </div>
  )
}
