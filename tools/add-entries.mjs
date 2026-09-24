// 用法: node tools/add-entries.mjs <batch.json> [--dry]
// 把一批新档案（JSON 数组，字段见 src/data/schema.js）写进对应分类文件末尾。
// 若条目带 image_candidate { file: 'File:xxx.jpg', page, author, license }：
//   经 Commons API 下载 960px 宽缩略图到 public/images/<id>.<ext>，生成 image 字段。
// 拒绝：重复 id、非自由许可图片。写完请跑 npm run validate:data 与 npm run lint:depth。
import fs from 'node:fs'
import path from 'node:path'
import { ALL } from '../src/data/index.js'

const [batchPath] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const dry = process.argv.includes('--dry')
if (!batchPath) { console.error('usage: node tools/add-entries.mjs <batch.json> [--dry]'); process.exit(1) }

const FILE_OF = { civilization: 'civilizations.js', figure: 'figures.js', artifact: 'artifacts.js', event: 'events.js' }
const FREE = /^(public domain|pd|cc0|cc[ -]by(?:[ -]sa)?[ -]\d(\.\d)?)/i
const UA = 'guanshi-bot/1.0 (history site; image attribution tooling)'
const existing = new Set(ALL.map((e) => e.id))
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'))

const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ') + "'"
const ind = (n) => ' '.repeat(n)

function serialize(e) {
  const L = []
  const kv = (k, v, n = 4) => L.push(ind(n) + k + ': ' + v + ',')
  L.push('  {')
  kv('id', q(e.id)); kv('category', q(e.category)); kv('name', q(e.name))
  if (e.foreign) kv('foreign', q(e.foreign))
  if (e.image) {
    L.push('    image: {')
    for (const k of ['src', 'page', 'author', 'license']) kv(k, q(e.image[k] || ''), 6)
    L.push('    },')
  }
  kv('region', q(e.region)); kv('year', String(e.year))
  if (Array.isArray(e.range)) kv('range', '[' + e.range.join(', ') + ']')
  kv('kicker', q(e.kicker)); kv('summary', q(e.summary))
  L.push('    paragraphs: [')
  for (const p of e.paragraphs || []) L.push('      ' + q(p) + ',')
  L.push('    ],')
  if (e.sections?.length) {
    L.push('    sections: [')
    for (const s of e.sections) {
      L.push('      {')
      L.push('        heading: ' + q(s.heading) + ',')
      L.push('        paragraphs: [')
      for (const p of s.paragraphs) L.push('          ' + q(p) + ',')
      L.push('        ],')
      L.push('      },')
    }
    L.push('    ],')
  }
  if (e.quote) { kv('quote', q(e.quote)); kv('quoteBy', q(e.quoteBy || '')) }
  L.push('    facts: [')
  for (const f of e.facts || []) L.push('      { label: ' + q(f.label) + ', value: ' + q(f.value) + ' },')
  L.push('    ],')
  kv('related', '[' + (e.related || []).map(q).join(', ') + ']')
  L.push('    sources: [')
  for (const s of e.sources || []) L.push('      { label: ' + q(s.label) + ', url: ' + q(s.url) + ' },')
  L.push('    ],')
  L.push('  },')
  return L.join('\n')
}

async function fetchImage(e) {
  const c = e.image_candidate
  if (!c || !c.file) return null
  if (!FREE.test(String(c.license || '').trim())) { console.log('  跳过非自由许可图片:', e.id, c.license); return null }
  const title = c.file.startsWith('File:') ? c.file : 'File:' + c.file
  const api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|mime&iiurlwidth=960&titles=' + encodeURIComponent(title)
  const info = await (await fetch(api, { headers: { 'User-Agent': UA } })).json()
  const page = Object.values(info.query?.pages || {})[0]
  const ii = page?.imageinfo?.[0]
  if (!ii) { console.log('  Commons 找不到文件:', e.id, title); return null }
  const url = ii.thumburl || ii.url
  const ext = (path.extname(new URL(url).pathname).toLowerCase() || '.jpg').replace('.jpeg', '.jpg')
  const dest = 'public/images/' + e.id + ext
  if (!dry) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) { console.log('  下载失败:', e.id, res.status); return null }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 5000) { console.log('  图片过小，疑似错误页:', e.id); return null }
    fs.writeFileSync(dest, buf)
    console.log('  图片', dest, Math.round(buf.length / 1024) + 'KB')
  }
  return { src: '/' + dest.replace(/^public\//, ''), page: c.page || ii.descriptionurl || 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(title), author: c.author || 'Unknown author', license: c.license }
}

const add = {}
for (const e of batch) {
  if (existing.has(e.id)) { console.error('id 已存在，拒绝:', e.id); process.exit(1) }
  if (!FILE_OF[e.category]) { console.error('分类非法:', e.id, e.category); process.exit(1) }
  existing.add(e.id)
  const img = await fetchImage(e)
  const entry = { ...e, image: img || e.image || null }
  delete entry.image_candidate
  ;(add[FILE_OF[e.category]] ||= []).push(serialize(entry))
  console.log('+', e.id, '->', FILE_OF[e.category], img ? '(有图)' : '(无图)')
}
for (const [file, blocks] of Object.entries(add)) {
  const p = path.resolve('src/data', file)
  const src = fs.readFileSync(p, 'utf8')
  const at = src.lastIndexOf('\n];')
  if (at < 0) throw new Error('数组结尾未找到: ' + file)
  const out = src.slice(0, at) + '\n\n' + blocks.join('\n\n') + src.slice(at)
  if (!dry) fs.writeFileSync(p, out)
  console.log((dry ? '[dry] ' : '') + file + ': +' + blocks.length)
}
