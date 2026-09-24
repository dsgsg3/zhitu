// 用法: node tools/verify-bytes.mjs [id...]
// 核验指定条目：本地文件 hash 是否等于其 Commons 文件页原图 hash。不一致即错配。
// 无参数时核验全部同字节组条目。
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALL } from '../src/data/index.js'

const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/images')
const md5 = (b) => createHash('md5').update(Buffer.from(b)).digest('hex')

const DUP_IDS = 'ai-era india-independence changan-city wwii-end charlemagne-empire charlemagne confucius han-wudi dante deng-xiaoping gutenberg faberge-eggs forbidden-city first-flight wright-flyer french-revolution storming-of-bastille hangul-letter terracotta-army hypatia sunni-ali ibn-battuta zhang-qian persian-wars western-zhou-founding silk-road xinhai-revolution theodora wang-yangming'.split(' ')
const ids = process.argv.slice(2).length ? process.argv.slice(2) : DUP_IDS

for (const id of ids) {
  const e = ALL.find((x) => x.id === id)
  if (!e?.image?.src?.startsWith('/images/') || !e.image.page) {
    console.log(`${id}: 跳过（无本地图或无文件页）`)
    continue
  }
  try {
    const title = decodeURIComponent(e.image.page.split('/wiki/')[1])
    const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&formatversion=2&titles=' + encodeURIComponent(title)
    const j = await (await fetch(u, { headers: UA })).json()
    const remoteUrl = j?.query?.pages?.[0]?.imageinfo?.[0]?.url
    if (!remoteUrl) {
      console.log(`${id}: 文件页无原图`)
    } else {
      const [rb, lb] = await Promise.all([
        fetch(remoteUrl, { headers: UA }).then((r) => r.arrayBuffer()),
        Promise.resolve(readFileSync(join(dir, e.image.src.replace('/images/', '')))),
      ])
      console.log(`${id}: ${md5(rb) === md5(lb) ? '一致' : '错配'} <- ${e.image.src}`)
    }
  } catch (err) {
    console.log(`${id}: 查询失败 ${String(err).slice(0, 80)}`)
  }
  await sleep(6000)
}
