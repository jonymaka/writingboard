import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useSettingsStore, applyTheme } from './store/useSettingsStore'
import './styles/index.css'

applyTheme(useSettingsStore.getState().settings.theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
