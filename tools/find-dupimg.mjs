// 用法: node tools/find-dupimg.mjs — 找出含 2+ 个 image 块的条目
import { readFileSync } from 'node:fs'

for (const f of ['civilizations', 'figures', 'artifacts', 'events']) {
  const src = readFileSync(new URL(`../src/data/${f}.js`, import.meta.url), 'utf8')
  const blocks = src.split(/\n  \{/)
  for (const b of blocks) {
    const id = (b.match(/id: '([^']+)'/) || [])[1]
    if (!id) continue
    const n = (b.match(/image: \{/g) || []).length
    if (n > 1) console.log(`${f}.js :: ${id} :: ${n} blocks`)
  }
}
