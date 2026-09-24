// 用法: node tools/fetch-batch4a.mjs — 第四批A组：剩余文明 24
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'qin-han', wiki: 'Qin dynasty' },
  { id: 'sui', wiki: 'Sui dynasty' },
  { id: 'song', wiki: 'Song dynasty' },
  { id: 'yuan', wiki: 'Yuan dynasty' },
  { id: 'ming', search: 'Temple of Heaven' },
  { id: 'qing', search: 'Chengde Mountain Resort' },
  { id: 'indus', wiki: 'Indus Valley Civilisation' },
  { id: 'persian-empire', wiki: 'Achaemenid Empire' },
  { id: 'arab-empire', search: 'Dome of the Rock' },
  { id: 'ottoman-empire', wiki: 'Ottoman Empire' },
  { id: 'maya', wiki: 'Maya civilization' },
  { id: 'aztec-empire', wiki: 'Aztec Empire' },
  { id: 'inca-empire', search: 'Sacsayhuaman' },
  { id: 'srivijaya', wiki: 'Srivijaya' },
  { id: 'korea-three-kingdoms', wiki: 'Goguryeo' },
  { id: 'japan-yamato', search: 'Horyuji temple' },
  { id: 'funan-champa', search: 'My Son sanctuary' },
  { id: 'shang', wiki: 'Shang dynasty' },
  { id: 'zhou', wiki: 'Zhou dynasty' },
  { id: 'minoan', wiki: 'Minoan civilization' },
  { id: 'songhai', search: 'Timbuktu mosque' },
  { id: 'russian-empire', wiki: 'Russian Empire' },
  { id: 'united-states', search: 'Statue of Liberty' },
  { id: 'maori', search: 'Maori wharenui' },
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
    let file = null
    let candidates = []
    if (job.wiki) {
      file = await wikiImage(job.wiki)
      await sleep(6000)
    } else {
      candidates = await commonsSearch(job.search)
      file = candidates[0] || null
      await sleep(6000)
    }
    if (!file) {
      out.push({ ...job, error: 'no-file', candidates })
      continue
    }
    const m = await commonsMeta(file)
    await sleep(6000)
    out.push({ ...job, file, candidates: candidates.slice(1, 4), ...(m || { error: 'no-meta' }) })
  } catch (e) {
    out.push({ ...job, error: String(e).slice(0, 160) })
    await sleep(8000)
  }
}
console.log(JSON.stringify(out, null, 2))
