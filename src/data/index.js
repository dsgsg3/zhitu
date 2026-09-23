import PinyinMatch from 'pinyin-match'
import { civilizations } from './civilizations.js'
import { figures } from './figures.js'
import { artifacts } from './artifacts.js'
import { events } from './events.js'

export const ALL = [
  ...civilizations,
  ...figures,
  ...artifacts,
  ...events,
]

export const byId = Object.fromEntries(ALL.map((e) => [e.id, e]))

// 统一关键词命中（搜索框与档案库共用）：名字 > 外文名 > 标签 > 摘要 > 正文。
// 中文支持拼音/首字母（如 tang、tbl 命中唐）；返回命中字段序号，未命中 -1。
export function matchScore(entity, rawQuery) {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return -1
  const pools = [
    entity.name || '',
    entity.foreign || '',
    entity.kicker || '',
    entity.summary || '',
    (entity.paragraphs || []).join(' '),
    (entity.sections || []).map((s) => s.heading + ' ' + s.paragraphs.join(' ')).join(' '),
  ]
  for (let i = 0; i < pools.length; i++) {
    const text = pools[i]
    if (!text) continue
    if (text.toLowerCase().includes(q)) return i
    if (/[\u4e00-\u9fa5]/.test(text) && /[a-z]/.test(q)) {
      try {
        if (PinyinMatch.match(text, q)) return i + 0.5
      } catch {
        // 拼音库异常时退化为普通子串匹配
      }
    }
  }
  return -1
}

export function matchesKeyword(entity, rawQuery) {
  return matchScore(entity, rawQuery) >= 0
}

export function search(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return ALL.map((e) => ({ e, s: matchScore(e, q) }))
    .filter((r) => r.s >= 0)
    .sort((a, b) => a.s - b.s || a.e.year - b.e.year)
    .map((r) => r.e)
}

export function sameEra(year, range = 120) {
  if (year == null) return []
  return ALL.filter((e) => {
    if (e.year == null || e.id === undefined) return false
    const ey = e.range ? (e.range[0] + (e.range[1] ?? e.range[0])) / 2 : e.year
    return Math.abs(ey - year) <= range
  })
}
