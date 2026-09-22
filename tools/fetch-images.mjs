// 用法: node tools/fetch-images.mjs
// 词条主图拿不到好图时改用 Commons 搜索；请求间延时避免限流；URL 去掉 utm 参数
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'tang', search: 'Tang sancai camel' },
  { id: 'confucius', wiki: 'Confucius' },
  { id: 'terracotta-army', wiki: 'Terracotta Army' },
  { id: 'silk-road', search: 'Mogao Caves Dunhuang' },
  { id: 'rosetta-stone', wiki: 'Rosetta Stone' },
  { id: 'cleopatra', wiki: 'Cleopatra' },
  { id: 'mongol-empire', wiki: 'Mongol Empire' },
  { id: 'marie-curie', wiki: 'Marie Curie' },
  { id: 'roman-empire', wiki: 'Roman Empire' },
  { id: 'taj-mahal', wiki: 'Taj Mahal' },
]

async function getJson(url) {
  const r = await fetch(url, { headers: UA })
  const t = await r.text()
  return JSON.parse(t)
}

async function wikiImage(title) {
  const u =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=800&formatversion=2&titles=' +
    encodeURIComponent(title)
  const j = await getJson(u)
  const p = j?.query?.pages?.[0]
  return p?.pageimage || null
}

async function commonsSearch(query) {
  const u =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&generator=search' +
    '&gsrsearch=' + encodeURIComponent(query + ' filetype:bitmap') +
    '&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=800'
  const j = await getJson(u)
  const pages = j?.query?.pages || []
  return pages.map((p) => p.title.replace(/^File:/, ''))
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
      await sleep(1500)
    } else {
      candidates = await commonsSearch(job.search)
      file = candidates[0] || null
      await sleep(1500)
    }
    if (!file) {
      out.push({ ...job, error: 'no-file', candidates })
      continue
    }
    const m = await commonsMeta(file)
    await sleep(1500)
    out.push({ ...job, file, candidates: candidates.slice(1, 4), ...(m || { error: 'no-meta' }) })
  } catch (e) {
    out.push({ ...job, error: String(e).slice(0, 160) })
    await sleep(3000)
  }
}
console.log(JSON.stringify(out, null, 2))
