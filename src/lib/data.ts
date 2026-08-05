import type { Doc } from '../types/doc'
import type { Settings } from '../types/settings'

export const DATA_VERSION = 1

export interface PlatformData {
  version: number
  exportedAt: string
  docs: Doc[]
  settings: Settings
}

export function buildPlatformData(docs: Doc[], settings: Settings): PlatformData {
  return { version: DATA_VERSION, exportedAt: new Date().toISOString(), docs, settings }
}

export function serializePlatformData(data: PlatformData): string {
  return JSON.stringify(data, null, 2)
}

function sanitizeDoc(d: unknown): Doc {
  const o = (d ?? {}) as Record<string, unknown>
  const now = Date.now()
  return {
    id: typeof o.id === 'string' && o.id ? o.id : `imp-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: typeof o.title === 'string' ? o.title : '未命名文章',
    content: typeof o.content === 'string' ? o.content : '',
    createdAt: typeof o.createdAt === 'number' ? o.createdAt : now,
    updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : now,
  }
}

function isSettings(s: unknown): s is Settings {
  if (!s || typeof s !== 'object') return false
  const o = s as Record<string, unknown>
  const ai = o.ai as Record<string, unknown> | undefined
  if (!ai || typeof ai !== 'object') return false
  if (typeof o.theme !== 'string') return false
  if (typeof ai.baseUrl !== 'string') return false
  if (typeof ai.apiKey !== 'string') return false
  if (typeof ai.model !== 'string') return false
  return true
}

export function parsePlatformData(json: string): PlatformData {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('JSON 解析失败，请确认文件内容')
  }
  const data = raw as Partial<PlatformData>
  if (data.version !== DATA_VERSION) {
    throw new Error('数据版本不受支持')
  }
  if (!Array.isArray(data.docs)) {
    throw new Error('缺少文章数据（docs）')
  }
  if (!isSettings(data.settings)) {
    throw new Error('缺少或损坏的设置数据（settings）')
  }
  return {
    version: DATA_VERSION,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    docs: data.docs.map(sanitizeDoc),
    settings: data.settings,
  }
}
