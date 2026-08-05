import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  normalizeBaseUrl,
  validateSettings,
  streamChat,
  AiProviderError,
} from '../src/ai/provider'
import type { AiSettings } from '../src/types/settings'

const settings: AiSettings = {
  baseUrl: 'https://api.example.com/v1',
  apiKey: 'sk-test',
  model: 'test-model',
  temperature: 0.7,
}

function sseResponse(chunks: string[], status = 200) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(encoder.encode(c)))
      controller.close()
    },
  })
  return new Response(stream, { status, headers: { 'Content-Type': 'text/event-stream' } })
}

describe('normalizeBaseUrl', () => {
  it('strips trailing slashes', () => {
    expect(normalizeBaseUrl('https://api.example.com/v1///')).toBe('https://api.example.com/v1')
  })
})

describe('validateSettings', () => {
  it('returns null when valid', () => {
    expect(validateSettings(settings)).toBeNull()
  })
  it('reports missing base url', () => {
    expect(validateSettings({ ...settings, baseUrl: '' })).toContain('Base URL')
  })
  it('reports missing api key', () => {
    expect(validateSettings({ ...settings, apiKey: '' })).toContain('API Key')
  })
  it('reports missing model', () => {
    expect(validateSettings({ ...settings, model: '' })).toContain('模型')
  })
})

describe('streamChat', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('accumulates streamed tokens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        sseResponse([
          'data: {"choices":[{"delta":{"content":"你好"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"世界"}}]}\n\n',
          'data: [DONE]\n\n',
        ]),
      ),
    )

    const deltas: string[] = []
    const full = await streamChat(settings, [{ role: 'user', content: 'x' }], {
      onToken: (f, d) => deltas.push(`${f}|${d}`),
    })
    expect(full).toBe('你好世界')
    expect(deltas).toEqual(['你好|你好', '你好世界|世界'])
  })

  it('throws on non-ok response with provider detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'bad key' } }), { status: 401 }),
      ),
    )
    await expect(
      streamChat(settings, [{ role: 'user', content: 'x' }], { onToken: () => undefined }),
    ).rejects.toThrow(/bad key/)
  })

  it('throws AiProviderError with http status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 429 })))
    try {
      await streamChat(settings, [{ role: 'user', content: 'x' }], { onToken: () => undefined })
      expect.unreachable()
    } catch (err) {
      expect(err).toBeInstanceOf(AiProviderError)
      expect((err as AiProviderError).status).toBe(429)
    }
  })

  it('throws when settings incomplete', async () => {
    await expect(
      streamChat({ ...settings, apiKey: '' }, [{ role: 'user', content: 'x' }], {
        onToken: () => undefined,
      }),
    ).rejects.toThrow(/API Key/)
  })

  it('aborts on signal', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        controller.abort()
        return Promise.reject(new DOMException('aborted', 'AbortError'))
      }),
    )
    await expect(
      streamChat(settings, [{ role: 'user', content: 'x' }], { onToken: () => undefined }, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
