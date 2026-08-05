import { useRef, useState } from 'react'
import { useDocStore } from '../../store/useDocStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useUiStore } from '../../store/useUiStore'
import { downloadFile, htmlToMarkdown, markdownToHtml, readFileAsText } from '../../lib/export'

function DocItem({ id, title, active }: { id: string; title: string; active: boolean }) {
  const setActive = useDocStore((s) => s.setActive)
  const renameDoc = useDocStore((s) => s.renameDoc)
  const deleteDoc = useDocStore((s) => s.deleteDoc)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          renameDoc(id, draft.trim() || '未命名文章')
          setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') {
            setDraft(title)
            setEditing(false)
          }
        }}
        className="w-full rounded-md border px-2 py-1.5 text-[13px] outline-none font-editor"
        style={{ borderColor: 'var(--accent)', background: 'var(--surface-2)', color: 'var(--text)' }}
      />
    )
  }

  return (
    <div
      onClick={() => setActive(id)}
      onDoubleClick={() => {
        setDraft(title)
        setEditing(true)
      }}
      className="doc-item group relative flex cursor-pointer items-center justify-between gap-1 overflow-hidden rounded-md py-1.5 pl-3 pr-2 transition-colors"
      style={
        active
          ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
          : { color: 'var(--text-2)' }
      }
      title={title}
    >
      {active && (
        <span
          className="doc-bar absolute left-0 top-1 bottom-1 w-[3px] rounded-r"
          style={{ background: 'var(--accent)' }}
        />
      )}
      <span className="font-editor flex-1 truncate text-[14px]">{title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (window.confirm(`删除「${title}」？此操作不可撤销。`)) deleteDoc(id)
        }}
        className="hidden rounded px-1 text-[11px] hover:opacity-70 group-hover:inline"
        style={{ color: 'var(--danger)' }}
      >
        ✕
      </button>
    </div>
  )
}

export function DocList() {
  const docs = useDocStore((s) => s.docs)
  const activeId = useDocStore((s) => s.activeId)
  const createDoc = useDocStore((s) => s.createDoc)
  const importDoc = useDocStore((s) => s.importDoc)
  const setActive = useDocStore((s) => s.setActive)
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen)
  const settings = useSettingsStore((s) => s.settings)
  const fileRef = useRef<HTMLInputElement>(null)

  const activeDoc = docs.find((d) => d.id === activeId)

  const handleImport = async (file: File) => {
    const text = await readFileAsText(file)
    const name = file.name.replace(/\.(md|html|txt)$/i, '') || '导入的文章'
    let html = text
    if (/\.md$/i.test(file.name)) {
      html = await markdownToHtml(text)
    } else if (!/\.html?$/i.test(file.name)) {
      html = `<p>${text.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
    }
    const id = importDoc(name, html)
    setActive(id)
  }

  return (
    <aside
      className="anim-reveal relative flex w-56 shrink-0 flex-col border-r"
      style={{ background: 'color-mix(in srgb, var(--surface) 92%, transparent)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[13px] font-bold tracking-wider" style={{ color: 'var(--text-2)' }}>
            文稿
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
            {docs.length} 篇
          </span>
        </div>
        <button
          onClick={() => createDoc()}
          className="seal h-7 w-7 text-[15px]"
          title="新作一篇"
        >
          ＋
        </button>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {docs.length === 0 && (
          <div className="px-2 py-8 text-center font-editor text-[13px]" style={{ color: 'var(--text-3)' }}>
            案头空空
            <br />
            点右上角 ＋ 新作一篇
          </div>
        )}
        {docs.map((d, i) => (
          <div key={d.id} className="anim-chip" style={{ animationDelay: `${0.05 + i * 0.04}s` }}>
            <DocItem id={d.id} title={d.title} active={d.id === activeId} />
          </div>
        ))}
      </div>

      <div className="border-t p-2" style={{ borderColor: 'var(--border)' }}>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.html,.htm,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleImport(f)
            e.target.value = ''
          }}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            className="chip rounded-md py-1.5 text-[12px]"
          >
            导入
          </button>
          <button
            onClick={() => {
              if (!activeDoc) return
              downloadFile(`${activeDoc.title}.html`, activeDoc.content, 'text/html')
            }}
            className="chip rounded-md py-1.5 text-[12px]"
            disabled={!activeDoc}
          >
            导出
          </button>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              if (!activeDoc) return
              downloadFile(
                `${activeDoc.title}.md`,
                htmlToMarkdown(activeDoc.content),
                'text/markdown',
              )
            }}
            className="chip rounded-md py-1.5 text-[12px]"
            disabled={!activeDoc}
          >
            Markdown
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="chip rounded-md py-1.5 text-[12px]"
            title="设置"
          >
            设置
          </button>
        </div>
        <div
          className="mt-2 truncate px-1 font-editor text-[11px]"
          style={{ color: 'var(--text-3)' }}
        >
          {settings.ai.apiKey ? `所用 · ${settings.ai.model || '未定'} ` : '未添朱批之钥'}
        </div>
      </div>
    </aside>
  )
}
