// 用法: node tools/show-foreign.mjs <id...> — 打印指定条目的 foreign 行
import { readFileSync } from 'node:fs'

const ids = new Set(process.argv.slice(2))
for (const f of ['civilizations', 'figures', 'artifacts', 'events']) {
  const src = readFileSync(new URL(`../src/data/${f}.js`, import.meta.url), 'utf8')
  const blocks = src.split(/\n  \{/)
  for (const b of blocks) {
    const id = (b.match(/id: '([^']+)'/) || [])[1]
    if (id && ids.has(id)) {
      const fg = (b.match(/foreign: '((?:[^'\\]|\\.)*)'/) || [])[1]
      console.log(`${f}.js :: ${id} :: foreign: '${fg}'`)
    }
  }
}
