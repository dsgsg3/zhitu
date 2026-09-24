// 用法: node tools/dedupe-manual.mjs — 8 个人工项：7 个删第二个块，indus 删第一个块（留大浴池）
import { readFileSync, writeFileSync } from 'node:fs'

const keepSecond = new Set(['indus'])
const ids = new Set(['indus', 'aztec-empire', 'shang', 'united-states', 'maori', 'voyages-of-zhenghe', 'scientific-revolution', 'x-ray-discovery'])

for (const f of ['civilizations.js', 'events.js']) {
  const url = new URL(`../src/data/${f}`, import.meta.url)
  const src = readFileSync(url, 'utf8')
  const parts = src.split(/(\n  \{)/)
  let changed = false
  for (let i = 0; i < parts.length; i++) {
    const b = parts[i]
    const id = (b.match(/id: '([^']+)'/) || [])[1]
    if (!id || !ids.has(id)) continue
    let n = 0
    const dropFirst = keepSecond.has(id)
    parts[i] = b.replace(/image: \{[^}]*\},?/g, (m) => {
      n++
      if (dropFirst) return n === 1 ? '' : m
      return n === 2 ? '' : m
    })
    changed = true
    console.log(`${f} :: ${id} :: 删除${dropFirst ? '第一' : '第二'}块`)
  }
  if (changed) writeFileSync(url, parts.join(''))
}
