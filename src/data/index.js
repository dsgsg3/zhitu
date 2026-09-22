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

export function search(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return ALL.filter((e) =>
    [e.name, e.foreign || '', e.summary, e.kicker, ...(e.paragraphs || [])]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
}

export function sameEra(year, range = 120) {
  if (year == null) return []
  return ALL.filter((e) => {
    if (e.year == null || e.id === undefined) return false
    const ey = e.range ? (e.range[0] + (e.range[1] ?? e.range[0])) / 2 : e.year
    return Math.abs(ey - year) <= range
  })
}
