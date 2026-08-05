import { describe, it, expect } from 'vitest'
import {
  buildPlatformData,
  parsePlatformData,
  serializePlatformData,
  DATA_VERSION,
} from '../src/lib/data'
import type { Doc } from '../src/types/doc'
import type { Settings } from '../src/types/settings'

const docs: Doc[] = [
  { id: 'a', title: '一文', content: '<p>正文</p>', createdAt: 1, updatedAt: 2 },
  { id: 'b', title: '二文', content: '', createdAt: 1, updatedAt: 2 },
]

const settings: Settings = {
  ai: { baseUrl: 'https://x.example/v1', apiKey: 'sk-1', model: 'm', temperature: 0.7 },
  theme: 'dark',
}

describe('data round-trip', () => {
  it('serializes and parses back equal data', () => {
    const json = serializePlatformData(buildPlatformData(docs, settings))
    const parsed = parsePlatformData(json)
    expect(parsed.docs).toEqual(docs)
    expect(parsed.settings).toEqual(settings)
  })

  it('rejects invalid json', () => {
    expect(() => parsePlatformData('{not json')).toThrow(/JSON/)
  })

  it('rejects unsupported version', () => {
    const data = buildPlatformData(docs, settings)
    expect(() => parsePlatformData(JSON.stringify({ ...data, version: 99 }))).toThrow(/版本/)
  })

  it('rejects missing docs', () => {
    expect(() =>
      parsePlatformData(JSON.stringify({ version: DATA_VERSION, settings })),
    ).toThrow(/docs/)
  })

  it('rejects broken settings', () => {
    expect(() =>
      parsePlatformData(
        JSON.stringify({ version: DATA_VERSION, docs, settings: { theme: 'dark' } }),
      ),
    ).toThrow(/settings/)
  })

  it('sanitizes malformed docs on import', () => {
    const json = JSON.stringify({
      version: DATA_VERSION,
      docs: [{ id: 'ok', title: 't', content: 'c' }, { title: 'no-id' }, 'junk'],
      settings,
    })
    const parsed = parsePlatformData(json)
    expect(parsed.docs).toHaveLength(3)
    expect(parsed.docs[0].id).toBe('ok')
    expect(parsed.docs[1].id).toMatch(/^imp-/)
    expect(parsed.docs[2].title).toBe('未命名文章')
    expect(typeof parsed.docs[1].createdAt).toBe('number')
  })
})
