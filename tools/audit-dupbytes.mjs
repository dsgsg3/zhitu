// 用法: node tools/audit-dupbytes.mjs — 按 md5 分组，输出多文件同字节组 + 小文件
import { readdirSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALL } from '../src/data/index.js'

const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/images')
const byHash = new Map()
for (const f of readdirSync(dir)) {
  const b = readFileSync(join(dir, f))
  const h = createHash('md5').update(b).digest('hex')
  if (!byHash.has(h)) byHash.set(h, [])
  byHash.get(h).push({ f, size: b.length })
}
// 文件名 -> 条目 id（判断题材是否一致）
const fileToIds = new Map()
for (const e of ALL) {
  if (!e.image?.src?.startsWith('/images/')) continue
  const fn = e.image.src.replace('/images/', '')
  if (!fileToIds.has(fn)) fileToIds.set(fn, [])
  fileToIds.get(fn).push(e.id)
}
let groups = 0
for (const [h, fs] of byHash) {
  if (fs.length < 2) continue
  groups++
  const subjects = fs.map(({ f }) => `${f}(${(fileToIds.get(f) || ['无人引用']).join(',')})`).join(' | ')
  console.log(`${fs.length}x ${(fs[0].size / 1024).toFixed(0)}KB :: ${subjects}`)
}
console.log(`同字节组 ${groups} 个`)
// 小文件（<25KB 可能是缩略图/占位）
console.log('--- <25KB 文件 ---')
for (const f of readdirSync(dir)) {
  const b = readFileSync(join(dir, f))
  if (b.length < 25 * 1024) console.log(`${(b.length / 1024).toFixed(1)}KB ${f} <- ${(fileToIds.get(f) || ['无人引用']).join(',')}`)
}
