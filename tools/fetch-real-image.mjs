// 用法: node tools/fetch-real-image.mjs
// 重新下载指定条目在 Commons 上真正对应的主图（thumb800），覆盖 public/images 下的旧文件。
// 用于修正「数据里的 page 指向 A 图，但本地文件其实是 B 图」的错配（如 han-wudi 用了孔子壁画）。
// 复用 fetch-images.mjs 的 commonsMeta 解析与 apply-images.mjs 的 cleanAuthor 规则。
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

function cleanAuthor(a = '') {
  let s = String(a).trim()
  if (/^unknown author(\s*unknown author)+$/i.test(s)) return 'Unknown author'
  if (/unknown author/i.test(s) && s.replace(/unknown author/gi, '').trim() === '') return 'Unknown author'
  return s.replace(/(Unknown author)\1+/gi, '$1').slice(0, 120)
}

const fileFromPage = (page = '') => {
  const m = page.match(/\/wiki\/File:(.+)$/)
  if (!m) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

async function commonsMeta(file) {
  const u =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
    '&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=800&formatversion=2&titles=' +
    encodeURIComponent('File:' + file)
  const r = await fetch(u, { headers: UA })
  const j = await r.json()
  const info = j?.query?.pages?.[0]?.imageinfo?.[0]
  if (!info) return null
  const meta = info.extmetadata || {}
  return {
    thumb: clean(info.thumburl),
    license: stripHtml(meta.LicenseShortName?.value) || stripHtml(meta.License?.value),
    author: cleanAuthor(stripHtml(meta.Artist?.value)),
    page: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(file),
    size: info.width + 'x' + info.height,
  }
}

async function download(url, dest) {
  const r = await fetch(url, { headers: UA })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  const buf = Buffer.from(await r.arrayBuffer())
  writeFileSync(dest, buf)
  return buf.length
}

const targets = process.argv.slice(2)
if (!targets.length) {
  console.error('usage: node tools/fetch-real-image.mjs <id> [id...]')
  process.exit(1)
}

const DATA_DIR = path.resolve('src/data')
const FILES = ['civilizations.js', 'figures.js', 'artifacts.js', 'events.js']

for (const id of targets) {
  // 定位条目
  let entry = null
  let file = null
  let src = null
  for (const f of FILES) {
    const s = readFileSync(path.join(DATA_DIR, f), 'utf8')
    const idRe = new RegExp("id:\\s*'" + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'")
    const m = idRe.exec(s)
    if (!m) continue
    const start = s.lastIndexOf('{', m.index)
    let depth = 0,
      end = -1
    for (let i = start; i < s.length; i++) {
      if (s[i] === '{') depth++
      else if (s[i] === '}') {
        depth--
        if (depth === 0) {
          end = i + 1
          break
        }
      }
    }
    const block = s.slice(start, end)
    const srcM = block.match(/src:\s*'([^']+)'/)
    if (!srcM) break
    src = srcM[1]
    const pageM = block.match(/page:\s*'([^']+)'/)
    entry = block
    file = { name: f, content: s, span: { start, end }, block, page: pageM ? pageM[1] : '' }
    break
  }
  if (!file) {
    console.log(`SKIP ${id}: 未在数据文件中定位`)
    continue
  }

  const name = fileFromPage(file.page)
  if (!name) {
    console.log(`SKIP ${id}: 无法解析 Commons 文件名`)
    continue
  }

  try {
    const meta = await commonsMeta(name)
    await sleep(1200)
    if (!meta) {
      console.log(`FAIL ${id}: Commons 无此文件信息 (${name})`)
      continue
    }
    const dest = path.resolve('public', src.replace(/^\//, ''))
    const bytes = await download(meta.thumb, dest)
    await sleep(800)
    console.log(`OK ${id}: ${src}`)
    console.log(`   file    : ${name}`)
    console.log(`   origin  : ${meta.size} · 下载 ${Math.round((bytes / 1024) * 10) / 10}KB`)
    console.log(`   author  : ${meta.author}`)
    console.log(`   license : ${meta.license}`)
    console.log(`   page    : ${meta.page}`)
    console.log(`   JSON:`)
    console.log(
      JSON.stringify(
        { id, src: meta.thumb, page: meta.page, author: meta.author, license: meta.license },
        null,
        2,
      ),
    )
  } catch (e) {
    console.log(`FAIL ${id}: ${String(e).slice(0, 120)}`)
  }
}