// 用法: node tools/fix-images2.mjs — 重下 5 个被限流写坏的文件，校验 content-type 与大小
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALL } from '../src/data/index.js'

const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/images')
const IDS = 'india-independence changan-city forbidden-city hypatia terracotta-army'.split(' ')

for (const id of IDS) {
  const e = ALL.find((x) => x.id === id)
  try {
    const title = decodeURIComponent(e.image.page.split('/wiki/')[1])
    const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&formatversion=2&titles=' + encodeURIComponent(title)
    const j = await (await fetch(u, { headers: UA })).json()
    const remoteUrl = j?.query?.pages?.[0]?.imageinfo?.[0]?.url
    await sleep(10000)
    const r = await fetch(remoteUrl, { headers: UA })
    const ct = r.headers.get('content-type') || ''
    const buf = Buffer.from(await r.arrayBuffer())
    if (!ct.startsWith('image/') || buf.length < 10 * 1024) {
      console.log(`${id}: 仍失败 ct=${ct} size=${buf.length}，跳过不覆盖`)
    } else {
      writeFileSync(join(dir, e.image.src.replace('/images/', '')), buf)
      console.log(`${id}: 下载 ${(buf.length / 1024).toFixed(0)}KB ${ct}`)
    }
  } catch (err) {
    console.log(`${id}: 失败 ${String(err).slice(0, 80)}`)
  }
  await sleep(10000)
}
