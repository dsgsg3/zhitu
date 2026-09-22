// 用法: node tools/fetch-batch4c.mjs — 第四批C组：A组14个替换/复核（地图国旗错图）
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'indus', search: 'Mohenjo-daro Great Bath' },
  { id: 'persian-empire', search: 'Persepolis Apadana columns' },
  { id: 'ottoman-empire', search: 'Suleymaniye Mosque Istanbul' },
  { id: 'maya', search: 'Tikal Temple I' },
  { id: 'aztec-empire', search: 'Aztec Sun Stone' },
  { id: 'srivijaya', search: 'Muaro Jambi temple' },
  { id: 'korea-three-kingdoms', search: 'Goguryeo tomb mural hunting' },
  { id: 'funan-champa', check: 'Mỹ Sơn sanctuary group A.jpg' },
  { id: 'shang', search: 'Yinxu palace ruins' },
  { id: 'zhou', search: 'Da Ke Ding bronze' },
  { id: 'minoan', search: 'Knossos palace' },
  { id: 'russian-empire', search: 'Winter Palace Saint Petersburg' },
  { id: 'united-states', check: 'Statue of Liberty frontal 2.jpg' },
  { id: 'maori', check: 'Whakarewarewa wharenui 2011.JPG' },
  { id: 'houmuwu-ding', search: 'Houmuwu Ding' },
  { id: 'code-of-hammurabi', search: 'Code Hammurabi full view Louvre' },
  { id: 'dead-sea-scrolls', search: 'Dead Sea Scrolls Isaiah' },
  { id: 'silk-letter', search: 'Niya brocade five stars' },
  { id: 'sutton-hoo-helmet', search: 'Sutton Hoo helmet reconstruction' },
]

async function getJson(url) {
  const r = await fetch(url, { headers: UA })
  return JSON.parse(await r.text())
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
    if (!file) {
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
