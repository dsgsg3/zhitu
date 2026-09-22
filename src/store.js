import { useSyncExternalStore } from 'react'

// 足迹与收藏：纯 localStorage，无后端。
// 数据结构 { read: {id: ts}, fav: {id: ts} }，key 带版本，升级时可迁移。
const KEY = 'guanshi:v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { read: {}, fav: {} }
    const d = JSON.parse(raw)
    return { read: d.read || {}, fav: d.fav || {} }
  } catch {
    return { read: {}, fav: {} }
  }
}

let state = load()
const listeners = new Set()

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // 隐私模式等写失败时静默：功能降级，不打断阅读
  }
}

function emit() {
  for (const l of listeners) l()
}

function subscribe(l) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

function getSnapshot() {
  return state
}

export function useFootprint() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function markRead(id) {
  if (!id || state.read[id]) return
  state = { ...state, read: { ...state.read, [id]: Date.now() } }
  save()
  emit()
}

export function toggleFav(id) {
  if (!id) return
  const fav = { ...state.fav }
  if (fav[id]) delete fav[id]
  else fav[id] = Date.now()
  state = { ...state, fav }
  save()
  emit()
}

export function isRead(id, snap) {
  return Boolean((snap || state).read[id])
}

export function isFav(id, snap) {
  return Boolean((snap || state).fav[id])
}

export function readCount(snap) {
  return Object.keys((snap || state).read).length
}

export function favIds(snap) {
  const fav = (snap || state).fav
  return Object.keys(fav).sort((a, b) => fav[b] - fav[a])
}
