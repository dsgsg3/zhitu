// 第五批配图抓取：6 条新档案（2026-09-22）
// 用法: node tools/fetch-batch5.mjs && node tools/apply-images.mjs /tmp/batch5.json
import fs from 'node:fs'
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'september-11', wiki: 'September 11 attacks' },
  { id: 'global-financial-crisis', wiki: 'Financial crisis of 2007–2008' },
  { id: 'covid-pandemic', wiki: 'COVID-19 pandemic' },
  { id: 'ai-era', wiki: 'AlphaGo versus Lee Sedol' },
  { id: 'western-zhou-founding', wiki: 'He Zun' },
  { id: 'phoenician-alphabet', wiki: 'Phoenician alphabet' },
]

async function getJson(url) {
  const r = await fetch(url, { headers: UA })
  return JSON.parse(await r.text())
}

async function wikiImage(title) {
  const u =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=800&formatversion=2&titles=' +
    encodeURIComponent(title)
  const j = await getJson(u)
  return j?.query?.pages?.[0]?.pageimage || null
}

async function commonsMeta(file) {
  const u =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=800&formatversion=2&titles=' +
    encodeURIComponent('File:' + file)
  const j = await getJson(u)
  const info = j?.query?.pages?.[0]?.imageinfo?.[0]
  if (!info) return null
  const meta = info.extmetadata || {}
  return {
    file,
    thumb800: clean(info.thumburl),
    license: stripHtml(meta.LicenseShortName?.value) || stripHtml(meta.License?.value),
    author: stripHtml(meta.Artist?.value).slice(0, 120),
  }
}

const out = []
for (const job of JOBS) {
  try {
    const file = await wikiImage(job.wiki)
    await sleep(12000)
    if (!file) {
      out.push({ ...job, error: 'no-file' })
      console.log('MISS', job.id)
      continue
    }
    const m = await commonsMeta(file)
    await sleep(12000)
    out.push({ ...job, ...(m || { error: 'no-meta' }) })
    console.log('OK', job.id, file)
  } catch (e) {
    out.push({ ...job, error: String(e).slice(0, 160) })
    console.log('ERR', job.id, String(e).slice(0, 80))
    await sleep(15000)
  }
}
fs.writeFileSync('/tmp/batch5.json', JSON.stringify(out, null, 2))
console.log('DONE batch5 count=', out.length)
