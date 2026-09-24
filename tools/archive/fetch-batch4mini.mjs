// 用法: node tools/fetch-batch4mini.mjs — 5 个复核/重试
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'indus', search: 'Mohenjo-daro Great Bath' },
  { id: 'zhou', search: 'Da Ke Ding bronze' },
  { id: 'code-of-hammurabi', wiki: 'Code of Hammurabi' },
  { id: 'aztec-empire', check: 'Monolito de la Piedra del Sol.jpg' },
  { id: 'sutton-hoo-helmet', check: '1966 Ordnance Survey - Sutton Hoo helmet.jpg' },
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

async function commonsSearch(query) {
  const u =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&generator=search' +
    '&gsrsearch=' + encodeURIComponent(query + ' filetype:bitmap') +
    '&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=800'
  const j = await getJson(u)
  return (j?.query?.pages || []).map((p) => p.title.replace(/^File:/, ''))
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
    let cands = []
    let file = job.check || null
    if (!file && job.wiki) {
      file = await wikiImage(job.wiki)
      await sleep(6000)
    } else if (!file) {
      cands = await commonsSearch(job.search)
      file = cands[0] || null
      await sleep(6000)
    }
    if (!file) {
      out.push({ ...job, error: 'no-file' })
      continue
    }
    const m = await commonsMeta(file)
    await sleep(6000)
    out.push({ ...job, file, candidates: cands.slice(1, 4), ...(m || { error: 'no-meta' }) })
  } catch (e) {
    out.push({ ...job, error: String(e).slice(0, 160) })
    await sleep(8000)
  }
}
console.log(JSON.stringify(out, null, 2))
