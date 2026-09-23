// 用法: node tools/optimize-images.mjs [--write]
// 图片瘦身：删无引用文件；宽>960 缩到 960；PNG 照片转 JPG q82（同步改数据引用）；去元数据。
// GIF 跳过（可能含动画）。默认 dry-run 报告，加 --write 执行。
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { ALL } from '../src/data/index.js'

const require = createRequire('/tmp/sharp-tool/package.json')
const sharp = require('sharp')

const write = process.argv.includes('--write')
const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/images')
const pathOf = (f) => join(dir, f)
const sizeOf = (f) => readFileSync(pathOf(f)).length

// 数据引用了哪些文件
const refFiles = new Set(
  ALL.filter((e) => e.image?.src?.startsWith('/images/')).map((e) => e.image.src.replace('/images/', '')),
)

// 先算出全部 PNG→JPG 目标，避免误删同名孤儿文件
const files0 = readdirSync(dir)
const targets = new Set(files0.filter((f) => refFiles.has(f) && /\.png$/i.test(f)).map((f) => f.replace(/\.png$/i, '.jpg')))

let delBytes = 0
let convBytes = 0
const renames = [] // [old, new]
const files = readdirSync(dir)
for (const f of files) {
  if (!refFiles.has(f)) {
    if (targets.has(f)) {
      console.log(`孤儿但被转换目标占用，跳过删除: ${f}`)
      continue
    }
    const b = readFileSync(pathOf(f)).length
    console.log(`无引用${write ? '删除' : '(待删)'}: ${f} ${(b / 1024).toFixed(0)}KB`)
    delBytes += b
    if (write) rmSync(pathOf(f))
    continue
  }
  if (/\.gif$/i.test(f)) {
    console.log(`跳过 GIF: ${f}`)
    continue
  }
  const meta = await sharp(pathOf(f)).metadata()
  const needResize = (meta.width || 0) > 960
  const isPng = /\.png$/i.test(f)
  const bigJpg = !isPng && sizeOf(f) > 400 * 1024
  if (!needResize && !isPng && !bigJpg) continue
  const target = isPng ? f.replace(/\.png$/i, '.jpg') : f
  console.log(`${isPng ? '转JPG' : '压缩'}${needResize ? '+缩小' : ''}: ${f} -> ${target} (${meta.width}x${meta.height})`)
  if (!write) continue
  let pipe = sharp(pathOf(f)).rotate()
  if (needResize) pipe = pipe.resize({ width: 960, withoutEnlargement: true })
  const buf = await pipe.jpeg({ quality: 82 }).toBuffer()
  const before = readFileSync(pathOf(f)).length
  if (buf.length < before) {
    writeFileSync(pathOf(target), buf)
    if (target !== f) {
      rmSync(pathOf(f))
      renames.push([f, target])
    }
    convBytes += before - buf.length
  } else {
    console.log(`  (重压后更大，跳过: ${f})`)
  }
}
console.log(`\n删除释放 ${(delBytes / 1024 / 1024).toFixed(1)}MB，重压节省 ${(convBytes / 1024 / 1024).toFixed(1)}MB`)
if (write && renames.length) {
  // 同步更新数据文件中的引用
  for (const df of ['civilizations.js', 'figures.js', 'artifacts.js', 'events.js']) {
    const fp = join(dirname(fileURLToPath(import.meta.url)), '../src/data', df)
    let src = readFileSync(fp, 'utf8')
    for (const [a, b] of renames) src = src.split(`/images/${a}`).join(`/images/${b}`)
    writeFileSync(fp, src)
  }
  console.log(`更新引用 ${renames.length} 处:`, renames.map(([a]) => a).join(','))
}
