export type ThemeId = 'minimal-light' | 'paper' | 'dark'

export interface AiSettings {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
}

export interface Settings {
  ai: AiSettings
  theme: ThemeId
}
