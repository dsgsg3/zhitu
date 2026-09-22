// 生成 src/data/slim-index.js：时间轴与首屏用的精简索引（不含正文与图片）
// 用法: node tools/gen-slim-index.mjs（prebuild 时自动执行）
import fs from 'node:fs'
import { ALL } from '../src/data/index.js'
import { eraOf } from '../src/data/taxonomy.js'

const slim = ALL.map((e) => ({
  id: e.id,
  name: e.name,
  foreign: e.foreign || '',
  year: e.year,
  range: e.range || null,
  category: e.category,
  region: e.region,
  era: eraOf(e.year),
}))

const out =
  '// 自动生成，请勿手改 —— node tools/gen-slim-index.mjs\n' +
  'export const SLIM = ' + JSON.stringify(slim) + '\n\n' +
  'export const TOTAL = ' + ALL.length + '\n'

const dest = new URL('../src/data/slim-index.js', import.meta.url)
fs.writeFileSync(dest, out)
console.log('slim-index.js:', slim.length, 'entries,', (out.length / 1024).toFixed(1) + 'KB')
