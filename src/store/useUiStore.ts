import { create } from 'zustand'

export type PanelTab = 'chat' | 'summary' | 'check'

interface UiState {
  panelOpen: boolean
  panelTab: PanelTab
  panelPinned: boolean
  streaming: boolean
  settingsOpen: boolean
  undoHintAt: number
  openPanel: (tab?: PanelTab) => void
  closePanel: () => void
  setPanelTab: (tab: PanelTab) => void
  togglePinPanel: () => void
  setStreaming: (v: boolean) => void
  setSettingsOpen: (v: boolean) => void
  notifyAiApplied: () => void
}

export const useUiStore = create<UiState>((set) => ({
  panelOpen: false,
  panelTab: 'chat',
  panelPinned: false,
  streaming: false,
  settingsOpen: false,
  undoHintAt: 0,
  openPanel: (tab) => set({ panelOpen: true, panelTab: tab ?? 'chat' }),
  closePanel: () => set({ panelOpen: false }),
  setPanelTab: (tab) => set({ panelTab: tab }),
  togglePinPanel: () => set((s) => ({ panelPinned: !s.panelPinned })),
  setStreaming: (v) => set({ streaming: v }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  notifyAiApplied: () => set({ undoHintAt: Date.now() }),
}))
