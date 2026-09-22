// 用法: node tools/dump-dupimg.mjs [id...] — 打印指定条目的全部 image 块
import { readFileSync } from 'node:fs'

const want = new Set(process.argv.slice(2))
for (const f of ['civilizations', 'figures', 'artifacts', 'events']) {
  const src = readFileSync(new URL(`../src/data/${f}.js`, import.meta.url), 'utf8')
  const blocks = src.split(/\n  \{/)
  for (const b of blocks) {
    const id = (b.match(/id: '([^']+)'/) || [])[1]
    if (!id || (want.size && !want.has(id))) continue
    const imgs = [...b.matchAll(/image: \{([^}]*)\}/g)]
    if (imgs.length > 1 || (want.size && imgs.length)) {
      console.log(`### ${f}.js :: ${id}`)
      for (const m of imgs) console.log('  {' + m[1].trim().replace(/\n\s*/g, ' ') + ' }')
    }
  }
}
