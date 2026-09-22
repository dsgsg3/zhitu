// 用法: node tools/fetch-batch2d.mjs — 只查郑和：郑成功画像是错的，找郑和雕像/宝船
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

async function getJson(url) {
  const r = await fetch(url, { headers: UA })
  return JSON.parse(await r.text())
}

async function commonsSearch(query) {
  const u =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&generator=search' +
    '&gsrsearch=' + encodeURIComponent(query + ' filetype:bitmap') +
    '&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=800'
  return (await getJson(u))?.query?.pages || []
}

for (const q of ['Zheng He statue', 'Ming treasure ship Nanjing']) {
  const pages = await commonsSearch(q)
  await sleep(6000)
  for (const p of pages.slice(0, 4)) {
    const info = p.imageinfo?.[0]
    const meta = info?.extmetadata || {}
    console.log(JSON.stringify({
      q,
      file: p.title.replace(/^File:/, ''),
      thumb800: clean(info?.thumburl),
      license: stripHtml(meta.LicenseShortName?.value) || stripHtml(meta.License?.value),
      author: stripHtml(meta.Artist?.value).slice(0, 80),
    }))
  }
}
