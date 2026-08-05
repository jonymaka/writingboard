import { create } from 'zustand'
import type { AiSettings, Settings, ThemeId } from '../types/settings'
import * as storage from '../lib/storage'

const SETTINGS_KEY = 'settings'

const DEFAULT_SETTINGS: Settings = {
  ai: {
    baseUrl: '',
    apiKey: '',
    model: '',
    temperature: 0.7,
  },
  theme: 'minimal-light',
}

export function applyTheme(theme: ThemeId): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

interface SettingsState {
  settings: Settings
  setAi: (patch: Partial<AiSettings>) => void
  setTheme: (theme: ThemeId) => void
  replaceSettings: (settings: Settings) => void
}

function loadSettings(): Settings {
  const saved = storage.load<Partial<Settings>>(SETTINGS_KEY, {})
  return {
    ai: { ...DEFAULT_SETTINGS.ai, ...(saved.ai ?? {}) },
    theme: saved.theme ?? DEFAULT_SETTINGS.theme,
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: loadSettings(),
  setAi: (patch) =>
    set((state) => {
      const next: Settings = { ...state.settings, ai: { ...state.settings.ai, ...patch } }
      storage.save(SETTINGS_KEY, next)
      return { settings: next }
    }),
  setTheme: (theme) =>
    set((state) => {
      const next: Settings = { ...state.settings, theme }
      storage.save(SETTINGS_KEY, next)
      applyTheme(theme)
      return { settings: next }
    }),
  replaceSettings: (settings) => {
    storage.save(SETTINGS_KEY, settings)
    applyTheme(settings.theme)
    set({ settings })
  },
}))
