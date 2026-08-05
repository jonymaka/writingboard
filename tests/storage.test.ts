import { describe, it, expect, beforeEach } from 'vitest'
import * as storage from '../src/lib/storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips values', () => {
    storage.save('k', { a: 1 })
    expect(storage.load('k', null)).toEqual({ a: 1 })
  })

  it('returns fallback when missing', () => {
    expect(storage.load('missing', 42)).toBe(42)
  })

  it('returns fallback on corrupt json', () => {
    localStorage.setItem('writingboard:bad', '{oops')
    expect(storage.load('bad', 'fb')).toBe('fb')
  })

  it('removes keys', () => {
    storage.save('k', 1)
    storage.remove('k')
    expect(storage.load('k', null)).toBeNull()
  })

  it('detects storage availability', () => {
    expect(storage.storageAvailable()).toBe(true)
  })
})
