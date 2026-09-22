// 用法: node tools/list-noimg.mjs — 按文件列出无图条目 id + name
import { readFileSync } from 'node:fs'

for (const f of ['civilizations', 'figures', 'artifacts', 'events']) {
  const src = readFileSync(new URL(`../src/data/${f}.js`, import.meta.url), 'utf8')
  const blocks = src.split(/\n  \{/)
  const noimg = []
  for (const b of blocks) {
    const id = (b.match(/id: '([^']+)'/) || [])[1]
    if (!id || b.includes('image:')) continue
    const name = (b.match(/name: '((?:[^'\\]|\\.)*)'/) || [])[1]
    noimg.push(`${id}（${name}）`)
  }
  console.log(`== ${f}: ${noimg.length} ==`)
  console.log(noimg.join('、'))
}
