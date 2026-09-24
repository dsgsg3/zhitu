// 生成 src/data/slim-index.js：列表/卡片/时间轴用的精简索引。
// 含卡片所需全部字段（kicker/summary/image），不含正文 paragraphs/sections/facts/sources ——
// 详情页才按需加载全量。卡片新增字段时记得同步 EntityCard.jsx 的读取。
// 用法: node tools/gen-slim-index.mjs（prebuild 时自动执行）
import fs from 'node:fs'
import { ALL } from '../src/data/index.js'
import { eraOf } from '../src/data/taxonomy.js'

const slim = ALL.map((e) => ({
  id: e.id,
  name: e.name,
  foreign: e.foreign || '',
  kicker: e.kicker || '',
  summary: e.summary || '',
  image: e.image || null,
  year: e.year,
  range: e.range || null,
  category: e.category,
  region: e.region,
  era: eraOf(e.year),
  // 详情页 related 卡与朗读兜底文本组装在未加载全量时也要能用
  related: e.related || [],
}))

const out =
  '// 自动生成，请勿手改 —— node tools/gen-slim-index.mjs\n' +
  'export const SLIM = ' + JSON.stringify(slim) + '\n\n' +
  'export const TOTAL = ' + ALL.length + '\n'

const dest = new URL('../src/data/slim-index.js', import.meta.url)
fs.writeFileSync(dest, out)
console.log('slim-index.js:', slim.length, 'entries,', (out.length / 1024).toFixed(1) + 'KB')
