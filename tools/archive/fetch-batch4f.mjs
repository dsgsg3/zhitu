// 用法: node tools/fetch-batch4f.mjs — 第四批F组：事件上半 20
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'an-shi-rebellion', wiki: 'An Lushan' },
  { id: 'jingkang-incident', wiki: 'Jingkang incident' },
  { id: 'grand-canal', wiki: 'Grand Canal (China)' },
  { id: 'voyages-of-zhenghe', search: 'Zheng He voyages fleet' },
  { id: 'opium-war', wiki: 'First Opium War' },
  { id: 'lin-zexu', wiki: 'Lin Zexu' },
  { id: 'xinhai-revolution', wiki: 'Xinhai Revolution' },
  { id: 'changan-city', wiki: "Chang'an" },
  { id: 'constantinople-fall', wiki: 'Fall of Constantinople' },
  { id: 'black-death', wiki: 'Black Death' },
  { id: 'charlemagne-empire', wiki: 'Charlemagne' },
  { id: 'columbus-voyage', wiki: 'Columbian exchange' },
  { id: 'reformation', wiki: 'Reformation' },
  { id: 'scientific-revolution', wiki: 'Scientific Revolution' },
  { id: 'europe-enlightenment', wiki: 'Age of Enlightenment' },
  { id: 'wwii-outbreak', wiki: 'World War II' },
  { id: 'wwii-end', search: 'United Nations founding San Francisco 1945' },
  { id: 'india-independence', wiki: 'Indian independence movement' },
  { id: 'great-pyramid-built', wiki: 'Great Pyramid of Giza' },
  { id: 'first-olympics', wiki: 'Ancient Olympic Games' },
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
