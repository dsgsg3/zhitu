import { useEffect, useState } from 'react'
import { SLIM } from './slim-index.js'

// 两级数据加载：
// - slimIndex：同步可用的精简索引（卡片字段 + related），列表/地图/时间轴/关联卡足够
// - loadData()：全量正文 chunk（4 个分类文件并行），详情页正文与正文级搜索时拉起
let promise
export function loadData() {
  if (!promise) promise = import('./index.js')
  return promise
}

const slimById = Object.fromEntries(SLIM.map((e) => [e.id, e]))

// Per-entity body: /data/entity/<id>.json is generated at build (tools/prerender.mjs),
// a few KB each instead of the ~1.3MB (gzip) full data. Prerendered pages inline
// the first entity as <script id="entity-data">. Dev server has no JSON -> falls back to loadData().
const entityCache = new Map()
if (typeof document !== 'undefined') {
  const el = document.getElementById('entity-data')
  if (el) {
    try {
      const e = JSON.parse(el.textContent)
      if (e && e.id) entityCache.set(e.id, e)
    } catch { /* ignore broken inline data */ }
  }
}

export function seedEntity(e) {
  if (e && e.id) entityCache.set(e.id, e)
}

export function getCachedEntity(id) {
  return entityCache.get(id) || null
}

export async function loadEntity(id) {
  if (entityCache.has(id)) return entityCache.get(id)
  let e = null
  try {
    const r = await fetch('/data/entity/' + encodeURIComponent(id) + '.json')
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) e = await r.json()
  } catch { /* offline or dev: fall back below */ }
  if (!e) {
    const m = await loadData()
    e = m.byId[id] || null
  }
  if (e) entityCache.set(id, e)
  return e
}

// 精简索引的同步查询：详情页 related、sameEra 等只用卡片字段，无需等全量
export const slimIndex = { SLIM, byId: slimById }

export function useData() {
  const [mod, setMod] = useState(null)
  useEffect(() => {
    let on = true
    loadData().then((m) => { if (on) setMod(m) })
    return () => { on = false }
  }, [])
  return mod
}
