import { create } from 'zustand'
import type { Doc } from '../types/doc'
import * as storage from '../lib/storage'
import { createId } from '../lib/id'
import { useAnnotationStore } from './useAnnotationStore'

const DOCS_KEY = 'docs'
const ACTIVE_KEY = 'activeDocId'

interface DocState {
  docs: Doc[]
  activeId: string | null
  createDoc: (title?: string) => string
  renameDoc: (id: string, title: string) => void
  deleteDoc: (id: string) => void
  setActive: (id: string) => void
  updateContent: (id: string, content: string) => void
  importDoc: (title: string, content: string) => string
  replaceAll: (docs: Doc[]) => void
}

function loadDocs(): Doc[] {
  const docs = storage.load<Doc[]>(DOCS_KEY, [])
  if (!Array.isArray(docs)) return []
  return docs.filter((d) => d && typeof d.id === 'string')
}

function persist(docs: Doc[], activeId: string | null): void {
  storage.save(DOCS_KEY, docs)
  storage.save(ACTIVE_KEY, activeId)
}

function sortDocs(docs: Doc[]): Doc[] {
  return [...docs].sort((a, b) => b.updatedAt - a.updatedAt)
}

export const useDocStore = create<DocState>((set, get) => ({
  docs: loadDocs(),
  activeId: storage.load<string | null>(ACTIVE_KEY, null),

  createDoc: (title = '未命名文章') => {
    const id = createId()
    const now = Date.now()
    const doc: Doc = { id, title, content: '', createdAt: now, updatedAt: now }
    const docs = sortDocs([...get().docs, doc])
    set({ docs, activeId: id })
    persist(docs, id)
    return id
  },

  renameDoc: (id, title) => {
    const docs = get().docs.map((d) => (d.id === id ? { ...d, title, updatedAt: Date.now() } : d))
    set({ docs })
    persist(docs, get().activeId)
  },

  deleteDoc: (id) => {
    const docs = get().docs.filter((d) => d.id !== id)
    let activeId = get().activeId
    if (activeId === id) {
      activeId = docs[0]?.id ?? null
    }
    set({ docs, activeId })
    persist(docs, activeId)
    useAnnotationStore.getState().clearDoc(id)
  },

  setActive: (id) => {
    set({ activeId: id })
    storage.save(ACTIVE_KEY, id)
  },

  updateContent: (id, content) => {
    const docs = get().docs.map((d) => (d.id === id ? { ...d, content, updatedAt: Date.now() } : d))
    const sorted = sortDocs(docs)
    set({ docs: sorted })
    persist(sorted, get().activeId)
  },

  importDoc: (title, content) => {
    const id = get().createDoc(title)
    get().updateContent(id, content)
    return id
  },

  replaceAll: (docs) => {
    const sorted = sortDocs(docs)
    const activeId = sorted[0]?.id ?? null
    set({ docs: sorted, activeId })
    persist(sorted, activeId)
  },
}))
