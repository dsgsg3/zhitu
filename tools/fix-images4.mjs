// 用法: node tools/fix-images4.mjs — forbidden 重试一次 + india/terracotta 超大文件压到 960
import { writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { ALL } from '../src/data/index.js'

const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const require = createRequire('/tmp/sharp-tool/package.json')
const sharp = require('sharp')
const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/images')

// 1) forbidden-city 重试
{
  const e = ALL.find((x) => x.id === 'forbidden-city')
  try {
    const title = decodeURIComponent(e.image.page.split('/wiki/')[1])
    const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&formatversion=2&titles=' + encodeURIComponent(title)
    const j = await (await fetch(u, { headers: UA })).json()
    const remoteUrl = j?.query?.pages?.[0]?.imageinfo?.[0]?.url
    await sleep(15000)
    const r = await fetch(remoteUrl, { headers: UA })
    const ct = r.headers.get('content-type') || ''
    const buf = Buffer.from(await r.arrayBuffer())
    if (!ct.startsWith('image/') || buf.length < 10 * 1024) {
      console.log(`forbidden-city: 仍失败 ct=${ct} size=${buf.length}`)
    } else {
      writeFileSync(join(dir, 'forbidden-city.jpg'), buf)
      console.log(`forbidden-city: 下载 ${(buf.length / 1024).toFixed(0)}KB`)
    }
  } catch (err) {
    console.log(`forbidden-city: 失败 ${String(err).slice(0, 80)}`)
  }
}

// 2) 超大文件压到 960px q82
for (const f of ['india-independence.jpg', 'terracotta-army.jpg']) {
  const p = join(dir, f)
  const meta = await sharp(p).metadata()
  if ((meta.width || 0) <= 960) {
    console.log(`${f}: 已够小，跳过`)
    continue
  }
  const before = readFileSync(p).length
  const buf = await sharp(p).rotate().resize({ width: 960, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()
  writeFileSync(p, buf)
  console.log(`${f}: ${(before / 1024).toFixed(0)}KB -> ${(buf.length / 1024).toFixed(0)}KB`)
}
