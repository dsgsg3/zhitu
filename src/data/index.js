import { civilizations } from './civilizations.js'
import { figures } from './figures.js'
import { artifacts } from './artifacts.js'
import { events } from './events.js'

// 匹配函数本体在 match.js（轻量，不拉全量数据），这里重导出保持兼容
export { matchScore, matchesKeyword } from './match.js'
import { matchScore } from './match.js'

export const ALL = [
  ...civilizations,
  ...figures,
  ...artifacts,
  ...events,
]

export const byId = Object.fromEntries(ALL.map((e) => [e.id, e]))

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
