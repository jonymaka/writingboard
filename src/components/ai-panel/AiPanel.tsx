import { useUiStore, type PanelTab } from '../../store/useUiStore'
import { ChatTab } from './ChatTab'
import { SummaryTab } from './SummaryTab'
import { CheckTab } from './CheckTab'

const TABS: { key: PanelTab; label: string }[] = [
  { key: 'chat', label: '对语' },
  { key: 'summary', label: '提要' },
  { key: 'check', label: '校雠' },
]

export function AiPanel() {
  const open = useUiStore((s) => s.panelOpen)
  const tab = useUiStore((s) => s.panelTab)
  const pinned = useUiStore((s) => s.panelPinned)
  const closePanel = useUiStore((s) => s.closePanel)
  const setTab = useUiStore((s) => s.setPanelTab)
  const togglePin = useUiStore((s) => s.togglePinPanel)

  if (!open) return null

  return (
    <div
      className="anim-panel flex h-full w-[400px] shrink-0 flex-col border-l"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div
        className="flex items-center gap-1 border-b px-3 py-2.5"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
      >
        <span className="seal mr-1.5 h-5 w-5 text-[10px]" title="朱批案牍">
          牍
        </span>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="chip rounded-md px-3 py-1.5 font-display text-[13px] tracking-wide"
            style={
              tab === t.key
                ? { background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700 }
                : undefined
            }
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={togglePin}
          className="chip rounded-md px-2 py-1 text-[12.5px]"
          title={pinned ? '已锁定 · 点击解锁' : '锁定案牍 · 编辑时亦常开'}
          style={pinned ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
        >
          📌
        </button>
        <button onClick={closePanel} className="chip rounded-md px-2 py-1 text-[12.5px]">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === 'chat' && <ChatTab />}
        {tab === 'summary' && <SummaryTab />}
        {tab === 'check' && <CheckTab />}
      </div>
    </div>
  )
}
