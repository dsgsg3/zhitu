// 用法: node tools/fetch-batch4b.mjs — 第四批B组：剩余文物 28
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'houmuwu-ding', search: 'Simuwu Ding bronze' },
  { id: 'code-of-hammurabi', search: 'Code of Hammurabi stele Louvre full' },
  { id: 'qingming-scroll', wiki: 'Along the River During the Qingming Festival' },
  { id: 'blue-white-porcelain', search: 'Yuan blue and white porcelain jar' },
  { id: 'tutankhamun-mask', wiki: 'Tutankhamun' },
  { id: 'dead-sea-scrolls', wiki: 'Dead Sea Scrolls' },
  { id: 'silk-letter', search: 'Wuxing brocade armband Niya' },
  { id: 'antikythera-mechanism', wiki: 'Antikythera mechanism' },
  { id: 'lindisfarne-gospels', wiki: 'Lindisfarne Gospels' },
  { id: 'viking-longship', wiki: 'Gokstad ship' },
  { id: 'mappa-mundi', wiki: 'Hereford Mappa Mundi' },
  { id: 'liberty-bell-press', search: 'Gutenberg Bible copy page' },
  { id: 'movable-type', wiki: 'Movable type' },
  { id: 'zhenghe-shipyard', search: 'Nanjing treasure ship replica' },
  { id: 'astrolabe-portolan', wiki: 'Astrolabe' },
  { id: 'moon-rabbit-tomb', search: 'Mawangdui silk banner' },
  { id: 'sutton-hoo-helmet', wiki: 'Sutton Hoo' },
  { id: 'benin-bronzes', wiki: 'Benin Bronzes' },
  { id: 'first-computer-bug', wiki: 'ENIAC' },
  { id: 'epic-of-gilgamesh', search: 'Gilgamesh tablet British Museum' },
  { id: 'hanging-gardens', search: 'Hanging Gardens of Babylon painting' },
  { id: 'angkor-wat', wiki: 'Angkor Wat' },
  { id: 'stonehenge', wiki: 'Stonehenge' },
  { id: 'oracle-bones', search: 'Oracle bones Yinxu pit' },
  { id: 'pompeii', wiki: 'Pompeii' },
  { id: 'yuanmingyuan', wiki: 'Old Summer Palace' },
  { id: 'magnetic-compass', search: 'Si Nan compass model' },
  { id: 'sydney-opera-house', wiki: 'Sydney Opera House' },
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
