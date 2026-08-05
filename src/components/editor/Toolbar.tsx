import { useUiStore } from '../../store/useUiStore'

const ACTIONS: { key: 'chat' | 'summary' | 'check'; label: string }[] = [
  { key: 'chat', label: '对话' },
  { key: 'summary', label: '摘要 / 大纲' },
  { key: 'check', label: '校雠' },
]

export function Toolbar() {
  const openPanel = useUiStore((s) => s.openPanel)
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen)
  const activeTab = useUiStore((s) => s.panelTab)
  const panelOpen = useUiStore((s) => s.panelOpen)

  return (
    <header
      className="ink-bar anim-reveal flex h-14 items-center gap-3 border-b px-4"
      style={{ background: 'color-mix(in srgb, var(--surface) 88%, transparent)', borderColor: 'var(--border)', backdropFilter: 'blur(8px)' }}
    >
      <div className="flex items-center gap-2.5">
        <span className="seal anim-seal h-8 w-8 text-[15px]" title="写作工坊">
          写
        </span>
        <div className="leading-tight">
          <div className="font-display text-[16px] font-black tracking-wide">写作工坊</div>
          <div
            className="text-[9px] uppercase tracking-[0.32em]"
            style={{ color: 'var(--text-3)' }}
          >
            Atelier of Writing
          </div>
        </div>
      </div>

      <div className="mx-1 h-6 w-px" style={{ background: 'var(--border)' }} />

      <div className="flex items-center gap-1.5">
        {ACTIONS.map((a, i) => {
          const active = panelOpen && activeTab === a.key
          return (
            <button
              key={a.key}
              onClick={() => openPanel(a.key)}
              className="chip anim-chip rounded-md px-3 py-1.5 text-[13px]"
              style={{
                animationDelay: `${0.1 + i * 0.05}s`,
                ...(active ? { background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 500 } : {}),
              }}
            >
              {a.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1" />

      <button
        onClick={() => setSettingsOpen(true)}
        className="chip rounded-md px-2.5 py-1.5 text-[13px]"
        title="设置"
      >
        设置
      </button>
    </header>
  )
}
