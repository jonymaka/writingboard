import { useAnnotationStore, type Annotation } from '../../store/useAnnotationStore'
import { useDocStore } from '../../store/useDocStore'
import { getEditor } from '../../lib/editorRef'
import { removeAnnotationFromDoc } from '../../lib/annotation'

export function AnnotationPanel() {
  const activeId = useDocStore((s) => s.activeId)
  const annotations = useAnnotationStore((s) => (activeId ? s.byDoc[activeId] : undefined)) ?? []
  const remove = useAnnotationStore((s) => s.remove)

  const handleDelete = (a: Annotation) => {
    if (!activeId) return
    remove(activeId, a.id)
    const editor = getEditor()
    if (editor) removeAnnotationFromDoc(editor, a.number)
  }

  return (
    <aside
      className="anim-panel flex h-full min-w-[220px] flex-1 shrink-0 flex-col border-l"
      style={{
        background: 'color-mix(in srgb, var(--surface) 72%, transparent)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="flex items-center gap-1 border-b px-3 py-2.5"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
      >
        <span className="seal mr-1.5 h-5 w-5 text-[10px]" title="旁批笺注">
          批
        </span>
        <span
          className="chip rounded-md px-3 py-1.5 font-display text-[13px] tracking-wide"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700 }}
        >
          旁批
        </span>
        <div className="flex-1" />
        <span className="text-[10.5px]" style={{ color: 'var(--text-3)' }}>
          {annotations.length} 则
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {annotations.length === 0 ? (
          <div className="py-12 text-center font-editor text-[13px]" style={{ color: 'var(--text-3)' }}>
            选中文中文字
            <br />
            点浮栏「旁批」即落笺注
            <br />
            <span className="text-[11.5px]" style={{ color: 'var(--text-3)', opacity: 0.75 }}>
              注解其在上下文中的含义
            </span>
          </div>
        ) : (
          <ul className="space-y-3">
            {annotations.map((a) => (
              <li
                key={a.id}
                className="anim-chip overflow-hidden rounded-lg border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
              >
                <div className="flex items-start gap-2 px-3 pb-1 pt-2.5">
                  <span className="annotation-ref" data-n={a.number} />
                  <p
                    className="flex-1 whitespace-pre-wrap font-editor text-[13px] leading-relaxed"
                    style={{ color: 'var(--text)' }}
                  >
                    {a.text}
                  </p>
                  <button
                    onClick={() => handleDelete(a)}
                    className="chip rounded px-1.5 py-0.5 text-[11px]"
                    title="删除此批"
                    style={{ color: 'var(--danger)' }}
                  >
                    ✕
                  </button>
                </div>
                <div className="px-3 pb-2.5 pt-1">
                  <div
                    className="mb-1 flex items-center gap-1.5 text-[10.5px]"
                    style={{ color: 'var(--accent)', fontFamily: 'var(--font-ui)' }}
                  >
                    <span className="seal h-3.5 w-3.5 text-[7px]">注</span>
                    旁批笺注
                  </div>
                  <p
                    className="whitespace-pre-wrap font-editor text-[13px] leading-relaxed"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {a.note}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
