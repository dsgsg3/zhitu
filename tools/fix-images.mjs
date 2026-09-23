// 用法: node tools/fix-images.mjs — 下载 14 个错配条目的文件页原图，覆盖本地文件
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALL } from '../src/data/index.js'

const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/images')
const IDS = 'india-independence changan-city dante gutenberg forbidden-city hypatia zhang-qian silk-road hangul-letter terracotta-army persian-wars western-zhou-founding theodora wang-yangming'.split(' ')

for (const id of IDS) {
  const e = ALL.find((x) => x.id === id)
  try {
    const title = decodeURIComponent(e.image.page.split('/wiki/')[1])
    const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize&formatversion=2&titles=' + encodeURIComponent(title)
    const j = await (await fetch(u, { headers: UA })).json()
    const info = j?.query?.pages?.[0]?.imageinfo?.[0]
    if (!info?.url) {
      console.log(`${id}: 无原图`)
    } else {
      const buf = Buffer.from(await (await fetch(info.url, { headers: UA })).arrayBuffer())
      writeFileSync(join(dir, e.image.src.replace('/images/', '')), buf)
      console.log(`${id}: 下载 ${(buf.length / 1024).toFixed(0)}KB ${info.width}x${info.height}`)
    }
  } catch (err) {
    console.log(`${id}: 失败 ${String(err).slice(0, 80)}`)
  }
  await sleep(6000)
}
