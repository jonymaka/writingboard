import { create } from 'zustand'
import * as storage from '../lib/storage'
import { createId } from '../lib/id'

export interface Annotation {
  id: string
  number: number
  text: string
  before: string
  after: string
  note: string
  createdAt: number
}

const KEY = 'annotations'

interface AnnotationState {
  byDoc: Record<string, Annotation[]>
  add: (docId: string, data: Omit<Annotation, 'id' | 'number' | 'createdAt'>) => Annotation
  remove: (docId: string, id: string) => void
  clearDoc: (docId: string) => void
}

function loadByDoc(): Record<string, Annotation[]> {
  const raw = storage.load<Record<string, Annotation[]>>(KEY, {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw
}

function persist(byDoc: Record<string, Annotation[]>): void {
  storage.save(KEY, byDoc)
}

function nextNumber(list: Annotation[]): number {
  return list.length ? Math.max(...list.map((a) => a.number)) + 1 : 1
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  byDoc: loadByDoc(),
  add: (docId, data) => {
    const list = get().byDoc[docId] ?? []
    const annotation: Annotation = {
      id: createId(),
      number: nextNumber(list),
      createdAt: Date.now(),
      ...data,
    }
    const byDoc = { ...get().byDoc, [docId]: [...list, annotation] }
    set({ byDoc })
    persist(byDoc)
    return annotation
  },
  remove: (docId, id) => {
    const list = (get().byDoc[docId] ?? []).filter((a) => a.id !== id)
    const byDoc = { ...get().byDoc, [docId]: list }
    set({ byDoc })
    persist(byDoc)
  },
  clearDoc: (docId) => {
    const byDoc = { ...get().byDoc }
    delete byDoc[docId]
    set({ byDoc })
    persist(byDoc)
  },
}))
