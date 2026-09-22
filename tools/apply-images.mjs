// 用法: node tools/apply-images.mjs /tmp/batch4e.json [--force]
// 把抓取结果写入 src/data/*.js 的 image 字段
import fs from 'node:fs'
import path from 'node:path'

const batchPath = process.argv[2]
const force = process.argv.includes('--force')
if (!batchPath) {
  console.error('usage: node tools/apply-images.mjs <batch.json> [--force]')
  process.exit(1)
}

const FREE = /^(public domain|cc0|cc[ -]by(?:[ -]sa)?[ -]\d|cc[ -]by[ -]\d|no restrictions|pd-)/i
const DATA_DIR = path.resolve('src/data')
const FILES = ['civilizations.js', 'figures.js', 'artifacts.js', 'events.js']

function cleanAuthor(a = '') {
  let s = String(a).trim()
  if (/^unknown author(\s*unknown author)+$/i.test(s)) return 'Unknown author'
  if (/unknown author/i.test(s) && s.replace(/unknown author/gi, '').trim() === '') return 'Unknown author'
  s = s.replace(/(Unknown author)\1+/gi, '$1')
  return s.slice(0, 120)
}

function pageUrl(file) {
  return 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(file)
}

function imageBlock(img, indent = '    ') {
  const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
  return [
    indent + 'image: {',
    indent + '  src: ' + q(img.src) + ',',
    indent + '  page: ' + q(img.page) + ',',
    indent + '  author: ' + q(img.author) + ',',
    indent + '  license: ' + q(img.license) + ',',
    indent + '},',
  ].join('\n')
}

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

function replaceImage(blockSrc, img, force) {
  const hasImage = /\n\s*image:\s*\{/.test(blockSrc)
  if (hasImage && !force) return null
  if (hasImage && force) {
    return blockSrc.replace(
      /(\n[ \t]*image:\s*\{)([\s\S]*?)(\n[ \t]*\},)/,
      (_, a, _b, c) => {
        const indent = a.match(/^(\n[ \t]*)image:/)[1]
        return '\n' + imageBlock(img, indent.trimEnd() ? indent.slice(1) : indent) + c.replace(/^\n[ \t]*/, '\n    ')
      },
    )
  }
  // insert before region:
  if (/\n[ \t]*region:/.test(blockSrc)) {
    return blockSrc.replace(/(\n[ \t]*region:)/, '\n' + imageBlock(img) + '$1')
  }
  // fallback: after foreign or name
  if (/\n[ \t]*foreign:/.test(blockSrc)) {
    return blockSrc.replace(/(\n[ \t]*foreign:[^\n]*\n)/, '$1' + imageBlock(img) + '\n')
  }
  if (/\n[ \t]*name:/.test(blockSrc)) {
    return blockSrc.replace(/(\n[ \t]*name:[^\n]*\n)/, '$1' + imageBlock(img) + '\n')
  }
  return null
}

const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'))
const byFile = new Map(FILES.map((f) => [f, { src: fs.readFileSync(path.join(DATA_DIR, f), 'utf8'), touched: false }]))

let applied = 0
let skipped = 0
const notes = []

for (const item of batch) {
  const { id, thumb800, file, license, author, error } = item
  if (error || !thumb800 || !file) {
    notes.push(`SKIP ${id}: ${error || 'incomplete'}`)
    skipped++
    continue
  }
  const lic = String(license || '').trim()
  if (!FREE.test(lic)) {
    notes.push(`SKIP ${id}: license=${lic || '(none)'}`)
    skipped++
    continue
  }
  const img = {
    src: thumb800,
    page: pageUrl(file),
    author: cleanAuthor(author),
    license: lic,
  }
  let wrote = false
  for (const [fname, holder] of byFile) {
    const span = findEntrySpan(holder.src, id)
    if (!span) continue
    const block = holder.src.slice(span.start, span.end)
    const next = replaceImage(block, img, force)
    if (!next || next === block) continue
    holder.src = holder.src.slice(0, span.start) + next + holder.src.slice(span.end)
    holder.touched = true
    wrote = true
    notes.push(`OK ${id} -> ${fname}${force && /\n\s*image:/.test(block) ? ' (replace)' : ''}`)
    applied++
    break
  }
  if (!wrote) {
    const hasImg = [...byFile.values()].some((h) => {
      const span = findEntrySpan(h.src, id)
      return span && /\n\s*image:/.test(h.src.slice(span.start, span.end))
    })
    notes.push(`MISS ${id}${hasImg ? ' (already has image, use --force)' : ' (id not found)'}`)
    skipped++
  }
}

for (const [fname, holder] of byFile) {
  if (holder.touched) fs.writeFileSync(path.join(DATA_DIR, fname), holder.src)
}

console.log(notes.join('\n'))
console.log(`applied=${applied} skipped=${skipped}`)
