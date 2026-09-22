// 用法: npm run audit:depth — 内容厚度审计（字数含 paragraphs 与 sections）
// 目标线：试点条目 ≥1200 字；全站 ≥600 字；引文逐步补齐。
import { ALL } from '../src/data/index.js'

const charsOf = (e) =>
  (e.paragraphs || []).join('').length +
  (e.sections || []).reduce((n, s) => n + s.heading.length + s.paragraphs.join('').length, 0)

const rows = ALL.map((e) => ({
  id: e.id,
  cat: e.category,
  chars: charsOf(e),
  paras: (e.paragraphs || []).length + (e.sections || []).reduce((n, s) => n + s.paragraphs.length, 0),
  sections: (e.sections || []).length,
  facts: (e.facts || []).length,
  sources: (e.sources || []).length,
  quote: !!e.quote,
}))

const bucket = (c) => (c < 300 ? '<300' : c < 600 ? '300-600' : c < 1000 ? '600-1000' : c < 1500 ? '1000-1500' : '1500+')
const hist = {}
for (const r of rows) { const b = bucket(r.chars); hist[b] = (hist[b] || 0) + 1 }
console.log('== 正文字数分布（含分节） ==')
for (const b of ['<300', '300-600', '600-1000', '1000-1500', '1500+']) console.log(b.padEnd(10), String(hist[b] || 0).padStart(4), '条')
console.log('中位:', rows.map(r => r.chars).sort((a, b) => a - b)[Math.floor(rows.length / 2)], '字')
for (const cat of ['civilization', 'figure', 'artifact', 'event']) {
  const rs = rows.filter((r) => r.cat === cat)
  const med = rs.map(r => r.chars).sort((a, b) => a - b)[Math.floor(rs.length / 2)]
  const deep = rs.filter(r => r.chars >= 1000).length
  const noQuote = rs.filter(r => !r.quote).length
  console.log(cat.padEnd(13), 'n=' + rs.length, '中位', String(med).padStart(5) + '字', '深度(≥1000)', deep, '条', '无引文', noQuote, '条')
}
console.log()
console.log('== 最薄 15 条 ==')
for (const r of [...rows].sort((a, b) => a.chars - b.chars).slice(0, 15))
  console.log(String(r.chars).padStart(5) + '字', String(r.paras).padStart(2) + '段', r.cat.padEnd(13), r.id)
console.log('== 最厚 10 条（标杆） ==')
for (const r of [...rows].sort((a, b) => b.chars - a.chars).slice(0, 10))
  console.log(String(r.chars).padStart(5) + '字', String(r.paras).padStart(2) + '段', String(r.sections).padStart(2) + '节', r.cat.padEnd(13), r.id)
