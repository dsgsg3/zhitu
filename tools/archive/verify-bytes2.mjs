// 用法: node tools/verify-bytes2.mjs [id...] — 本地文件 vs 原图 vs 800缩略图，三方比对
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALL } from '../src/data/index.js'

const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/images')
const md5 = (b) => createHash('md5').update(Buffer.from(b)).digest('hex')
const ids = process.argv.slice(2)

for (const id of ids) {
  const e = ALL.find((x) => x.id === id)
  try {
    const title = decodeURIComponent(e.image.page.split('/wiki/')[1])
    const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize&iiurlwidth=800&formatversion=2&titles=' + encodeURIComponent(title)
    const j = await (await fetch(u, { headers: UA })).json()
    const info = j?.query?.pages?.[0]?.imageinfo?.[0]
    const local = md5(readFileSync(join(dir, e.image.src.replace('/images/', ''))))
    let ro = '?', rt = '?'
    if (info?.url) ro = md5(await (await fetch(info.url, { headers: UA })).arrayBuffer()) === local ? '同原图' : '非原图'
    if (info?.thumburl) rt = md5(await (await fetch(info.thumburl, { headers: UA })).arrayBuffer()) === local ? '同缩略图' : '非缩略图'
    console.log(`${id}: ${ro} / ${rt} (远端 ${info?.width}x${info?.height})`)
  } catch (err) {
    console.log(`${id}: 查询失败 ${String(err).slice(0, 60)}`)
  }
  await sleep(6000)
}
