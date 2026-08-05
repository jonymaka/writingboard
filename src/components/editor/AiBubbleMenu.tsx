import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react'
import { buildSelectionMessages, buildAnnotationMessages, STYLE_TARGETS, type SelectionAction } from '../../lib/prompts'
import { useAiRequest } from '../../hooks/useAiRequest'
import {
  useInsertAfterSelection,
  useReplaceSelection,
  normalizeOutput,
} from '../../hooks/useReplaceSelection'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useUiStore } from '../../store/useUiStore'
import { useDocStore } from '../../store/useDocStore'
import { useAnnotationStore } from '../../store/useAnnotationStore'

interface ActiveJob {
  action: SelectionAction
  sourceText: string
  from: number
  to: number
  output: string
  streaming: boolean
  error?: string
  opts?: { customInstruction?: string; styleTarget?: string; before?: string; after?: string }
}

const CONTEXT_CHARS = 500

const MAIN_ACTIONS: { key: SelectionAction; label: string }[] = [
  { key: 'polish', label: '润色' },
  { key: 'rewrite', label: '改写' },
  { key: 'continue', label: '续写' },
  { key: 'expand', label: '扩写' },
  { key: 'shorten', label: '缩写' },
  { key: 'style', label: '风骨' },
  { key: 'fix', label: '校雠' },
  { key: 'annotate', label: '旁批' },
  { key: 'custom', label: '手谕' },
]

export function AiBubbleMenu({ editor }: { editor: Editor }) {
  const [mode, setMode] = useState<'main' | 'style' | 'custom'>('main')
  const [job, setJob] = useState<ActiveJob | null>(null)
  const [customInput, setCustomInput] = useState('')
  const { run, abort } = useAiRequest()
  const setStreaming = useUiStore((s) => s.setStreaming)
  const notifyAiApplied = useUiStore((s) => s.notifyAiApplied)
  const settings = useSettingsStore((s) => s.settings)

  const replaceSelection = useReplaceSelection(editor)
  const insertAfterSelection = useInsertAfterSelection(editor)

  const getSelectionContext = (from: number, to: number) => {
    const doc = editor.state.doc
    const size = doc.content.size
    const before = doc.textBetween(Math.max(0, from - CONTEXT_CHARS), from, '\n').trim()
    const after = doc.textBetween(to, Math.min(size, to + CONTEXT_CHARS), '\n').trim()
    return { before, after }
  }

  const startJob = (action: SelectionAction, opts?: ActiveJob['opts']) => {
    const { from, to } = editor.state.selection
    const sourceText = editor.state.doc.textBetween(from, to, '\n').trim()
    if (!sourceText) return
    const { before, after } = getSelectionContext(from, to)
    const context = { before, after }
    const newJob: ActiveJob = { action, sourceText, from, to, output: '', streaming: true, opts: { ...opts, ...context } }
    setJob(newJob)
    setMode('main')
    setStreaming(true)
    const messages =
      action === 'annotate'
        ? buildAnnotationMessages(sourceText, { before, after })
        : buildSelectionMessages(action, sourceText, newJob.opts)
    void run(messages, {
      onDelta: (full) => setJob((j) => (j ? { ...j, output: normalizeOutput(full) } : j)),
      onDone: (full) => {
        setJob((j) => (j ? { ...j, output: normalizeOutput(full), streaming: false } : j))
        setStreaming(false)
      },
      onError: (err) => {
        setJob((j) => (j ? { ...j, error: err.message, streaming: false } : j))
        setStreaming(false)
      },
    })
  }

  const applyAnnotation = () => {
    if (!job || !job.output) return
    const docState = useDocStore.getState()
    const activeDoc = docState.docs.find((d) => d.id === docState.activeId)
    if (!activeDoc) return
    const created = useAnnotationStore.getState().add(activeDoc.id, {
      text: job.sourceText,
      before: job.opts?.before ?? '',
      after: job.opts?.after ?? '',
      note: job.output,
    })
    editor
      .chain()
      .focus()
      .setTextSelection({ from: job.from, to: job.to })
      .setMark('annotationMark')
      .insertContentAt(job.to, { type: 'annotationRef', attrs: { number: created.number } })
      .run()
  }

  const applyResult = () => {
    if (!job || !job.output) return
    if (job.action === 'continue') {
      insertAfterSelection(job.output)
    } else if (job.action === 'annotate') {
      applyAnnotation()
    } else {
      replaceSelection(job.output)
    }
    notifyAiApplied()
    setJob(null)
  }

  const cancelJob = () => {
    abort()
    setJob(null)
    setStreaming(false)
  }

  const shouldShow = ({ editor: e }: { editor: Editor }) => {
    return !e.state.selection.empty || job !== null
  }

  const selectedCount = job
    ? job.sourceText.length
    : editor.state.selection.empty
      ? 0
      : editor.state.selection.content().content.size

  return (
    <BubbleMenu editor={editor} shouldShow={shouldShow} tippyOptions={{ maxWidth: 540, animation: 'fade' }}>
      <div
        className="rounded-xl border p-2 shadow-lg"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        {mode === 'main' && (
          <div className="flex flex-wrap items-center gap-1">
            {MAIN_ACTIONS.map((a, i) => (
              <button
                key={a.key}
                onClick={() => (a.key === 'style' ? setMode('style') : a.key === 'custom' ? setMode('custom') : startJob(a.key))}
                className="chip rounded-md px-2.5 py-1 text-[12.5px] anim-chip"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {mode === 'style' && (
          <div className="flex flex-wrap items-center gap-1">
            {STYLE_TARGETS.map((t) => (
              <button
                key={t}
                onClick={() => startJob('style', { styleTarget: t })}
                className="chip rounded-md px-2.5 py-1 text-[12.5px]"
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => setMode('main')}
              className="chip rounded-md px-2 py-1 text-[12.5px]"
            >
              ↩ 返回
            </button>
          </div>
        )}

        {mode === 'custom' && (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customInput.trim()) {
                  startJob('custom', { customInstruction: customInput })
                  setCustomInput('')
                }
              }}
              placeholder="手谕：如「改成更有感染力」"
              className="rounded-md border px-2 py-1 font-editor text-[13px] outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)', width: 230 }}
            />
            <button
              onClick={() => {
                if (customInput.trim()) {
                  startJob('custom', { customInstruction: customInput })
                  setCustomInput('')
                }
              }}
              className="btn-accent rounded-md px-3 py-1 text-[12.5px]"
              disabled={!customInput.trim()}
            >
              落印
            </button>
            <button onClick={() => setMode('main')} className="chip rounded-md px-2 py-1 text-[12.5px]">
              ✕
            </button>
          </div>
        )}

        {job && (
          <div
            className="anim-chip mt-1.5 max-h-64 overflow-y-auto rounded-lg p-2.5 text-[13px] leading-relaxed font-editor"
            style={{
              background: 'var(--accent-soft)',
              color: 'var(--text)',
              border: '1px solid color-mix(in srgb, var(--accent) 22%, var(--border))',
            }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10.5px]" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}>
                已选 {selectedCount} 字 ·{' '}
                {job.streaming
                  ? job.action === 'annotate'
                    ? '旁批中 …'
                    : '朱批中 …'
                  : job.error
                    ? '落笔有误'
                    : job.action === 'annotate'
                      ? '旁批已成'
                      : '朱批已成'}
              </span>
              {job.streaming && (
                <button
                  onClick={abort}
                  className="rounded px-1.5 text-[11px]"
                  style={{ color: 'var(--danger)', fontFamily: 'var(--font-ui)' }}
                >
                  ⏹ 停笔
                </button>
              )}
            </div>
            {job.error ? (
              <div className="text-[12px]" style={{ color: 'var(--danger)', fontFamily: 'var(--font-ui)' }}>
                {job.error}
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{job.output || '…'}</div>
            )}
            {!job.streaming && !job.error && (
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  onClick={applyResult}
                  className="btn-accent rounded-md px-3 py-1 text-[12px]"
                  disabled={!job.output}
                >
                  {job.action === 'annotate' ? '落批' : '朱批入文'}
                </button>
                <button
                  onClick={() => startJob(job.action, job.opts)}
                  className="chip rounded-md px-2.5 py-1 text-[12px]"
                >
                  ⟲ 重写
                </button>
                <button onClick={cancelJob} className="chip rounded-md px-2.5 py-1 text-[12px]">
                  ✕ 弃稿
                </button>
              </div>
            )}
          </div>
        )}

        {!job && (
          <div className="mt-1 px-1 text-[10.5px]" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}>
            {settings.ai.apiKey
              ? `选中文字，请 AI 落笔 · ${navigator.platform.includes('Mac') ? '⌘Z' : 'Ctrl+Z'} 可撤朱批`
              : '未添朱批之钥（API Key），请到设置中填写'}
          </div>
        )}
      </div>
    </BubbleMenu>
  )
}
