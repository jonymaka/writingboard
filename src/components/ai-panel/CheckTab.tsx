import { useState } from 'react'
import { buildFullDocMessages, extractPlainText } from '../../lib/prompts'
import { useAiRequest } from '../../hooks/useAiRequest'
import { useDocStore } from '../../store/useDocStore'

export function CheckTab() {
  const activeDoc = useDocStore((s) => s.docs.find((d) => d.id === s.activeId))
  const { run, abort, running } = useAiRequest()
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const runCheck = () => {
    if (!activeDoc) return
    const doc = extractPlainText(activeDoc.content)
    if (!doc.trim()) {
      setError('当前文章为空，请先输入内容')
      setResult('')
      return
    }
    setError('')
    setResult('')
    void run(buildFullDocMessages('check', doc), {
      onDelta: (full) => setResult(full),
      onDone: () => undefined,
      onError: (err) => setError(err.message),
    })
  }

  return (
    <div className="flex h-full flex-col px-4 py-3">
      <div className="flex gap-2">
        <button
          onClick={runCheck}
          disabled={running}
          className="btn-accent flex-1 rounded-lg py-2 font-display text-[13px] tracking-wide"
        >
          {running ? '校雠中 …' : '始校全文'}
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
            {result || '校雠中 …'}
            {result && !running && (
              <div className="mt-2" style={{ fontFamily: 'var(--font-ui)' }}>
                <button
                  onClick={() => navigator.clipboard?.writeText(result)}
                  className="chip rounded px-2 py-1 text-[11.5px]"
                >
                  誊录
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-10 text-center font-editor text-[13px]" style={{ color: 'var(--text-3)' }}>
            通校全文
            <br />
            勘错别字、语法、标点之误
          </div>
        )}
      </div>
    </div>
  )
}
