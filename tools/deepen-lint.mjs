// 用法: npm run lint:depth — 深度标准检查：达标条目 / 全站进度 / 未达标清单
// 标准（试点定稿）：正文 ≥1200 字 · sections 4-5 · facts ≥6 · 有 quote · related ≥4
import { ALL } from '../src/data/index.js'

const charsOf = (e) =>
  (e.paragraphs || []).join('').length +
  (e.sections || []).reduce((n, s) => n + s.heading.length + s.paragraphs.join('').length, 0)

const deep = []
const shallow = []
for (const e of ALL) {
  const chars = charsOf(e)
  const ok =
    chars >= 1200 &&
    (e.sections?.length ?? 0) >= 4 &&
    (e.facts?.length ?? 0) >= 6 &&
    !!e.quote &&
    (e.related?.length ?? 0) >= 4
  ;(ok ? deep : shallow).push({ id: e.id, chars, secs: e.sections?.length || 0 })
}
console.log(`深度达标: ${deep.length} / ${ALL.length} (${Math.round((deep.length / ALL.length) * 100)}%)`)
if (process.argv[2] === '--fail-list') {
  for (const r of shallow) console.log(' 未达标:', r.id, r.chars + '字', r.secs + '节')
}
