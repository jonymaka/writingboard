import type { AiSettings } from '../types/settings'
import type { ChatMessage } from '../lib/prompts'

export interface StreamCallbacks {
  onToken: (full: string, delta: string) => void
  onError?: (err: Error) => void
}

export class AiProviderError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AiProviderError'
    this.status = status
  }
}

export function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '')
  return trimmed
}

export function validateSettings(s: AiSettings): string | null {
  if (!s.baseUrl.trim()) return '请先配置 API Base URL'
  if (!s.apiKey.trim()) return '请先配置 API Key'
  if (!s.model.trim()) return '请先配置模型名称'
  return null
}

export async function streamChat(
  settings: AiSettings,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<string> {
  const missing = validateSettings(settings)
  if (missing) throw new AiProviderError(missing)

  const url = `${normalizeBaseUrl(settings.baseUrl)}/chat/completions`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        stream: true,
        temperature: settings.temperature ?? 0.7,
      }),
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new AiProviderError(`网络请求失败：${(err as Error).message}`)
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    let detail = ''
    try {
      const json = JSON.parse(raw) as { error?: { message?: string } }
      detail = json?.error?.message ?? ''
    } catch {
      detail = ''
    }
    if (!detail) detail = raw.slice(0, 200)
    throw new AiProviderError(
      detail ? `请求失败（${response.status}）：${detail}` : `请求失败（HTTP ${response.status}）`,
      response.status,
    )
  }

  if (!response.body) {
    throw new AiProviderError('响应没有内容流')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  const handleLine = (line: string) => {
    if (!line.startsWith('data:')) return
    const payload = line.slice(5).trim()
    if (payload === '[DONE]') return
    if (!payload) return
    try {
      const json = JSON.parse(payload)
      const delta = json?.choices?.[0]?.delta?.content ?? ''
      if (delta) {
        full += delta
        callbacks.onToken(full, delta)
      }
    } catch {
      // ignore malformed chunk
    }
  }

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) handleLine(line)
    }
    if (buffer.trim()) handleLine(buffer)
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new AiProviderError(`读取响应流失败：${(err as Error).message}`)
  }

  return full
}
