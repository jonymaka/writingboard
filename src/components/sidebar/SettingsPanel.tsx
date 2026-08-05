import { useRef, useState } from 'react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useDocStore } from '../../store/useDocStore'
import { useUiStore } from '../../store/useUiStore'
import { downloadFile, readFileAsText } from '../../lib/export'
import {
  buildPlatformData,
  parsePlatformData,
  serializePlatformData,
} from '../../lib/data'
import type { ThemeId } from '../../types/settings'

const THEMES: { id: ThemeId; label: string; desc: string; swatch: string }[] = [
  { id: 'minimal-light', label: '宣纸', desc: '素笺昼书', swatch: '#f4eddd' },
  { id: 'paper', label: '朱砂', desc: '温砂暮写', swatch: '#e7d7c0' },
  { id: 'dark', label: '墨夜', desc: '玄墨夜书', swatch: '#17130e' },
]

export function SettingsPanel() {
  const settings = useSettingsStore((s) => s.settings)
  const setAi = useSettingsStore((s) => s.setAi)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const replaceSettings = useSettingsStore((s) => s.replaceSettings)
  const docs = useDocStore((s) => s.docs)
  const replaceAllDocs = useDocStore((s) => s.replaceAll)
  const open = useUiStore((s) => s.settingsOpen)
  const setOpen = useUiStore((s) => s.setSettingsOpen)
  const dataFileRef = useRef<HTMLInputElement>(null)
  const [dataMsg, setDataMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (!open) return null

  const handleDataExport = () => {
    const data = buildPlatformData(docs, settings)
    const stamp = new Date().toISOString().slice(0, 10)
    downloadFile(`写作工坊全量数据-${stamp}.json`, serializePlatformData(data), 'application/json')
    setDataMsg({ ok: true, text: '已导出全量数据 JSON' })
  }

  const handleDataImport = async (file: File) => {
    setDataMsg(null)
    const text = await readFileAsText(file)
    try {
      const data = parsePlatformData(text)
      const ok = window.confirm(
        `将导入 ${data.docs.length} 篇文章并覆盖当前设置（含 API Key）。当前数据会被全部替换，确定继续？`,
      )
      if (!ok) return
      replaceAllDocs(data.docs)
      replaceSettings(data.settings)
      setOpen(false)
      window.setTimeout(
        () => window.alert('导入完成，全量数据已恢复'),
        200,
      )
    } catch (err) {
      setDataMsg({ ok: false, text: (err as Error).message })
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(20, 12, 4, 0.4)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="anim-reveal w-full max-w-md rounded-2xl border p-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center gap-2.5">
          <span className="seal h-7 w-7 text-[13px]">印</span>
          <h2 className="font-display text-[17px] font-black tracking-wide">文房设置</h2>
          <div className="flex-1" />
          <button onClick={() => setOpen(false)} className="chip rounded-md px-2 py-1 text-[13px]">
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <section>
            <h3 className="mb-2 font-display text-[12px] font-bold tracking-widest" style={{ color: 'var(--text-2)' }}>
              AI 接入 · OpenAI 兼容
            </h3>
            <div className="space-y-2.5">
              <label className="block">
                <span className="mb-1 block text-[11.5px]" style={{ color: 'var(--text-3)' }}>
                  Base URL
                </span>
                <input
                  value={settings.ai.baseUrl}
                  onChange={(e) => setAi({ baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full rounded-lg border px-3 py-2 font-editor text-[13px] outline-none focus:border-[var(--accent)]"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11.5px]" style={{ color: 'var(--text-3)' }}>
                  API Key
                </span>
                <input
                  type="password"
                  value={settings.ai.apiKey}
                  onChange={(e) => setAi({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full rounded-lg border px-3 py-2 font-editor text-[13px] outline-none focus:border-[var(--accent)]"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11.5px]" style={{ color: 'var(--text-3)' }}>
                  模型
                </span>
                <input
                  value={settings.ai.model}
                  onChange={(e) => setAi({ model: e.target.value })}
                  placeholder="gpt-4o-mini / deepseek-chat / glm-4-flash …"
                  className="w-full rounded-lg border px-3 py-2 font-editor text-[13px] outline-none focus:border-[var(--accent)]"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center justify-between text-[11.5px]" style={{ color: 'var(--text-3)' }}>
                  <span>落笔温度（创意）</span>
                  <span className="font-display">{settings.ai.temperature.toFixed(1)}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.1}
                  value={settings.ai.temperature}
                  onChange={(e) => setAi({ temperature: Number(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: 'var(--accent)' }}
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-display text-[12px] font-bold tracking-widest" style={{ color: 'var(--text-2)' }}>
              纸墨
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="rounded-lg border p-2.5 text-left transition-transform"
                  style={{
                    borderColor: settings.theme === t.id ? 'var(--accent)' : 'var(--border)',
                    background: settings.theme === t.id ? 'var(--accent-soft)' : 'var(--surface-2)',
                    transform: settings.theme === t.id ? 'translateY(-1px)' : undefined,
                  }}
                >
                  <span
                    className="mb-1.5 block h-6 w-6 rounded-md border"
                    style={{ background: t.swatch, borderColor: 'var(--border)' }}
                  />
                  <div className="font-display text-[12.5px] font-bold" style={{ color: 'var(--text)' }}>
                    {t.label}
                  </div>
                  <div className="text-[10.5px]" style={{ color: 'var(--text-3)' }}>
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-display text-[12px] font-bold tracking-widest" style={{ color: 'var(--text-2)' }}>
              全量数据
            </h3>
            <input
              ref={dataFileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleDataImport(f)
                e.target.value = ''
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDataExport}
                className="btn-accent rounded-lg py-2 text-[12.5px]"
              >
                导出全量 JSON
              </button>
              <button
                onClick={() => dataFileRef.current?.click()}
                className="chip rounded-lg py-2 text-[12.5px]"
              >
                导入全量 JSON
              </button>
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
              全量备份含全部文章与设置（含 API Key）。导入将覆盖当前所有数据。
            </p>
            {dataMsg && (
              <p
                className="mt-1.5 rounded-md px-2 py-1 text-[11px]"
                style={{
                  background: dataMsg.ok ? 'var(--surface-2)' : 'var(--accent-soft)',
                  color: dataMsg.ok ? 'var(--ok)' : 'var(--danger)',
                }}
              >
                {dataMsg.ok ? '✓ ' : '⚠ '}
                {dataMsg.text}
              </p>
            )}
          </section>

          <p
            className="rounded-lg p-3 font-editor text-[11.5px] leading-relaxed"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
          >
            谨告：API Key 仅存于本机浏览器（localStorage），不上传任何服务器。若此站托付公网，人人皆可从开发者工具窥得此钥，故请用免费或低配额之钥，仅自用之。
          </p>
        </div>
      </div>
    </div>
  )
}
