// 用法: node tools/fetch-batch3a.mjs — 第三批A组：新文明9 + 新人物13
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'assyria', wiki: 'Assyria' },
  { id: 'kush-kingdom', wiki: 'Kingdom of Kush' },
  { id: 'teotihuacan', wiki: 'Teotihuacan' },
  { id: 'dai-viet', wiki: 'Đại Việt' },
  { id: 'gupta-empire', wiki: 'Gupta Empire' },
  { id: 'vijayanagara', wiki: 'Vijayanagara' },
  { id: 'aksum', wiki: 'Aksum' },
  { id: 'hittite', wiki: 'Hittites' },
  { id: 'polynesia', wiki: 'Polynesia' },
  { id: 'wu-zetian', wiki: 'Wu Zetian' },
  { id: 'zhuge-liang', wiki: 'Zhuge Liang' },
  { id: 'joan-of-arc', wiki: 'Joan of Arc' },
  { id: 'nightingale', wiki: 'Florence Nightingale' },
  { id: 'sun-yat-sen', wiki: 'Sun Yat-sen' },
  { id: 'alan-turing', wiki: 'Alan Turing' },
  { id: 'hammurabi', wiki: 'Hammurabi' },
  { id: 'sappho', wiki: 'Sappho' },
  { id: 'galileo', wiki: 'Galileo Galilei' },
  { id: 'darwin', wiki: 'Charles Darwin' },
  { id: 'ada-lovelace', wiki: 'Ada Lovelace' },
  { id: 'frida-kahlo', wiki: 'Frida Kahlo' },
  { id: 'kamehameha', wiki: 'Kamehameha I' },
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
    await sleep(6000)
    if (!file) {
      out.push({ ...job, error: 'no-file' })
      continue
    }
    const m = await commonsMeta(file)
    await sleep(6000)
    out.push({ ...job, file, ...(m || { error: 'no-meta' }) })
  } catch (e) {
    out.push({ ...job, error: String(e).slice(0, 160) })
    await sleep(8000)
  }
}
console.log(JSON.stringify(out, null, 2))
