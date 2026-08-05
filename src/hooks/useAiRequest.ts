import { useCallback, useRef, useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { streamChat } from '../ai/provider'
import type { ChatMessage } from '../lib/prompts'

export interface AiRunHandlers {
  onDelta: (full: string, delta: string) => void
  onDone?: (full: string) => void
  onError?: (err: Error) => void
}

export function useAiRequest() {
  const settings = useSettingsStore((s) => s.settings)
  const controllerRef = useRef<AbortController | null>(null)
  const [running, setRunning] = useState(false)

  const run = useCallback(
    async (messages: ChatMessage[], handlers: AiRunHandlers) => {
      const controller = new AbortController()
      controllerRef.current = controller
      setRunning(true)
      try {
        const full = await streamChat(
          settings.ai,
          messages,
          { onToken: handlers.onDelta },
          controller.signal,
        )
        handlers.onDone?.(full)
        return full
      } catch (err) {
        handlers.onError?.(err as Error)
      } finally {
        setRunning(false)
        controllerRef.current = null
      }
    },
    [settings],
  )

  const abort = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setRunning(false)
  }, [])

  return { run, abort, running }
}
