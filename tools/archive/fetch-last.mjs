// 用法: node tools/fetch-last.mjs — 最后一张：百家争鸣（清华简），顺带复核 gutenberg 可达
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

async function getJson(url) {
  const r = await fetch(url, { headers: UA })
  return JSON.parse(await r.text())
}

const u =
  'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&generator=search' +
  '&gsrsearch=' + encodeURIComponent('Tsinghua bamboo slips filetype:bitmap') +
  '&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=800'
const j = await getJson(u)
for (const p of (j?.query?.pages || []).slice(0, 3)) {
  const info = p.imageinfo?.[0]
  const meta = info?.extmetadata || {}
  console.log(JSON.stringify({
    file: p.title.replace(/^File:/, ''),
    thumb800: clean(info?.thumburl),
    license: stripHtml(meta.LicenseShortName?.value) || stripHtml(meta.License?.value),
    author: stripHtml(meta.Artist?.value).slice(0, 100),
  }))
}
await sleep(2000)
const g = await fetch('https://upload.wikimedia.org/wikipedia/commons/5/5b/Mainz_Gutenbergdenkmal_2016_%28cropped%29.jpg', { method: 'HEAD' })
console.log('gutenberg-recheck:', g.status)
