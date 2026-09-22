// 用法: node tools/audit-img.mjs — 快速结构审计：总数、有图数、重复块、空字段（不发请求）
import { readFileSync } from 'node:fs'
import { ALL } from '../src/data/index.js'

console.log('total', ALL.length, 'img', ALL.filter((e) => e.image).length)
for (const e of ALL) {
  if (!e.image) {
    console.log('无图:', e.id)
    continue
  }
  const { src, page, author, license } = e.image
  if (!src || !page || !author || !license) console.log('空字段:', e.id, JSON.stringify(e.image).slice(0, 100))
}
for (const f of ['civilizations', 'figures', 'artifacts', 'events']) {
  const src = readFileSync(new URL(`../src/data/${f}.js`, import.meta.url), 'utf8')
  for (const b of src.split(/\n  \{/)) {
    const id = (b.match(/id: '([^']+)'/) || [])[1]
    if (!id) continue
    const n = (b.match(/image: \{/g) || []).length
    if (n > 1) console.log(`重复块: ${f} ${id} x${n}`)
  }
}
console.log('审计结束')
