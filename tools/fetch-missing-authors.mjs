// 用法: node tools/fetch-missing-authors.mjs [--apply]
// 补齐 image.author 为空的条目：从 Commons 文件页抓 Artist 元数据。
// 与 fetch-images.mjs 共用同一套元数据解析（commonsMeta）与作者清洗（cleanAuthor）规则。
// 默认只打印将要写入的内容，确认无误后再加 --apply 落盘。
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { ALL } from '../src/data/index.js'

const apply = process.argv.includes('--apply')
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stripHtml = (s = '') =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// 与 apply-images.mjs 的 cleanAuthor 保持一致
function cleanAuthor(a = '') {
  let s = String(a).trim()
  if (/^unknown author(\s*unknown author)+$/i.test(s)) return 'Unknown author'
  if (/unknown author/i.test(s) && s.replace(/unknown author/gi, '').trim() === '') return 'Unknown author'
  s = s.replace(/(Unknown author)\1+/gi, '$1')
  return s.slice(0, 120)
}

// 从 page URL 反推 Commons 文件名（含 %20 等百分号编码）
function fileFromPage(page = '') {
  const m = page.match(/\/wiki\/File:(.+)$/)
  if (!m) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

async function commonsAuthor(file) {
  const u =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
    '&iiprop=extmetadata&formatversion=2&titles=' +
    encodeURIComponent('File:' + file)
  const r = await fetch(u, { headers: UA })
  const j = await r.json()
  const info = j?.query?.pages?.[0]?.imageinfo?.[0]
  if (!info) return { author: null, credit: null }
  const meta = info.extmetadata || {}
  return {
    author: cleanAuthor(stripHtml(meta.Artist?.value)),
    credit: cleanAuthor(stripHtml(meta.Credit?.value)) || null,
    license: stripHtml(meta.LicenseShortName?.value),
  }
}

const targets = ALL.filter((e) => e.image && !(e.image.author || '').trim())
console.log(`待补 author 的条目: ${targets.length}\n`)

const resolved = []
for (const e of targets) {
  const file = fileFromPage(e.image.page)
  if (!file) {
    console.log(`SKIP ${e.id}: 无法从 page 解析文件名 (${e.image.page})`)
    continue
  }
  try {
    const meta = await commonsAuthor(file)
    await sleep(1200)
    const author = meta.author || meta.credit || ''
    if (!author) {
      console.log(`EMPTY ${e.id}: Commons 上 ${file} 的 Artist 与 Credit 均为空 —— 需人工填写`)
      continue
    }
    resolved.push({ id: e.id, file, author, license: meta.license || e.image.license })
    console.log(`OK ${e.id} <- ${file}\n     author: ${author}  (license: ${meta.license || e.image.license})`)
  } catch (err) {
    console.log(`FAIL ${e.id}: ${String(err).slice(0, 120)}`)
  }
}

console.log(`\n可自动补齐 ${resolved.length} / ${targets.length}`)
if (!apply) {
  console.log('（预览模式，加 --apply 写入 src/data/*.js）')
  process.exit(0)
}

const DATA_DIR = path.resolve('src/data')
const FILES = ['civilizations.js', 'figures.js', 'artifacts.js', 'events.js']
const byFile = new Map(FILES.map((f) => [f, readFileSync(path.join(DATA_DIR, f), 'utf8')]))

function findEntrySpan(src, id) {
  const idRe = new RegExp("id:\\s*'" + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'")
  const m = idRe.exec(src)
  if (!m) return null
  const start = src.lastIndexOf('{', m.index)
  if (start < 0) return null
  let depth = 0
  for (let i = start; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return { start, end: i + 1 }
    }
  }
  return null
}

let wrote = 0
for (const { id, author } of resolved) {
  for (const [fname, src] of byFile) {
    const span = findEntrySpan(src, id)
    if (!span) continue
    const block = src.slice(span.start, span.end)
    //只替换 image 块内的空 author
    if (!/image:\s*\{[\s\S]*?author:\s*''/.test(block)) continue
    const next = block.replace(/(image:\s*\{[\s\S]*?author:\s*)'[^']*'/, `$1'${author.replace(/'/g, "\\'")}'`)
    if (next === block) continue
    byFile.set(fname, src.slice(0, span.start) + next + src.slice(span.end))
    wrote++
    break
  }
}
for (const [fname, src] of byFile) writeFileSync(path.join(DATA_DIR, fname), src)
console.log(`\n已写入 ${wrote} 处`)