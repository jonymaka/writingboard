import { useEffect, useRef } from 'react'
import { DocList } from './components/sidebar/DocList'
import { Toolbar } from './components/editor/Toolbar'
import { Editor } from './components/editor/Editor'
import { AnnotationPanel } from './components/annotation/AnnotationPanel'
import { AiPanel } from './components/ai-panel/AiPanel'
import { SettingsPanel } from './components/sidebar/SettingsPanel'
import { useSettingsStore, applyTheme } from './store/useSettingsStore'
import { useDocStore } from './store/useDocStore'

function useEnsureDoc() {
  const docs = useDocStore((s) => s.docs)
  const activeId = useDocStore((s) => s.activeId)
  const createDoc = useDocStore((s) => s.createDoc)
  const setActive = useDocStore((s) => s.setActive)
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (docs.length === 0) {
      createDoc()
    } else if (!activeId || !docs.some((d) => d.id === activeId)) {
      setActive(docs[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export default function App() {
  const theme = useSettingsStore((s) => s.settings.theme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEnsureDoc()

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <DocList />
      <main className="flex min-w-0 flex-[3.5] flex-col">
        <Toolbar />
        <div className="flex-1 overflow-hidden">
          <Editor />
        </div>
      </main>
      <AnnotationPanel />
      <AiPanel />
      <SettingsPanel />
    </div>
  )
}
