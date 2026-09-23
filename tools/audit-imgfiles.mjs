// 用法: node tools/audit-imgfiles.mjs — public/images 文件 vs 数据引用对照
import { readdirSync } from 'node:fs'
import { ALL } from '../src/data/index.js'

const files = new Set(readdirSync(new URL('../public/images/', import.meta.url)))
const refs = new Map() // filename -> [ids]
for (const e of ALL) {
  if (!e.image?.src?.startsWith('/images/')) continue
  const fn = e.image.src.replace('/images/', '')
  if (!refs.has(fn)) refs.set(fn, [])
  refs.get(fn).push(e.id)
}
const orphan = [...files].filter((f) => ![...refs.keys()].includes(f))
console.log('files:', files.size, 'referenced:', refs.size, 'orphan:', orphan.length)
if (orphan.length) console.log('无引用文件:', orphan.slice(0, 20).join(','))
const multi = [...refs.entries()].filter(([, ids]) => ids.length > 1)
console.log('多条目共用一图:', multi.length)
for (const [f, ids] of multi.slice(0, 20)) console.log(' ', f, '<-', ids.join(','))
