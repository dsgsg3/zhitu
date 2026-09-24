// 用法: node tools/dedupe-images.mjs [--write]
// 同一档案出现多个 image 块时：src 相同则只保留第一个（信息更全的中文署名）；
// src 不同则报错列出，人工定夺。默认只报告，加 --write 才真正改文件。
import { readFileSync, writeFileSync } from 'node:fs'

const write = process.argv.includes('--write')
let removed = 0
for (const f of ['civilizations', 'figures', 'artifacts', 'events']) {
  const url = new URL(`../src/data/${f}.js`, import.meta.url)
  const src = readFileSync(url, 'utf8')
  const parts = src.split(/(\n  \{)/)
  let changed = false
  for (let i = 0; i < parts.length; i++) {
    const b = parts[i]
    if (!b.includes("id: '")) continue
    const matches = [...b.matchAll(/image: \{[^}]*\},?/g)]
    if (matches.length < 2) continue
    const srcs = matches.map((m) => (m[0].match(/src: '([^']+)'/) || [])[1])
    const id = (b.match(/id: '([^']+)'/) || [])[1]
    if (new Set(srcs).size > 1) {
      console.log(`需人工: ${f}.js ${id} 有 ${srcs.length} 张不同图`)
      continue
    }
    let n = 0
    parts[i] = b.replace(/image: \{[^}]*\},?/g, (m) => (++n === 1 ? m : ''))
    removed += matches.length - 1
    changed = true
  }
  if (changed && write) writeFileSync(url, parts.join(''))
}
console.log(write ? `删除重复块 ${removed} 个` : `可删除重复块 ${removed} 个（加 --write 执行）`)
