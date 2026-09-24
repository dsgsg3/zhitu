// 用法: node tools/fetch-batch3b.mjs — 第三批B组：新文物10 + 新事件15
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'forbidden-city', wiki: 'Forbidden City' },
  { id: 'versailles-palace', wiki: 'Palace of Versailles' },
  { id: 'djenne-mosque', check: 'Great Mosque of Djenné 3.jpg' },
  { id: 'nazca-lines', wiki: 'Nazca lines' },
  { id: 'borobudur', wiki: 'Borobudur' },
  { id: 'sanchi-stupa', search: 'Sanchi Stupa great stupa' },
  { id: 'petra', wiki: 'Petra' },
  { id: 'chichen-itza', wiki: 'Chichen Itza' },
  { id: 'lalibela', wiki: 'Lalibela' },
  { id: 'moai', wiki: 'Moai' },
  { id: 'french-revolution', wiki: 'French Revolution' },
  { id: 'meiji-restoration', wiki: 'Meiji Restoration' },
  { id: 'first-world-war', wiki: 'World War I' },
  { id: 'reform-opening', wiki: 'Chinese economic reform' },
  { id: 'moon-landing', wiki: 'Apollo 11' },
  { id: 'world-wide-web', wiki: 'World Wide Web' },
  { id: 'smartphone-era', wiki: 'Smartphone' },
  { id: 'beijing-olympics', wiki: '2008 Summer Olympics' },
  { id: 'marathon-battle', wiki: 'Battle of Marathon' },
  { id: 'berlin-conference', wiki: 'Berlin Conference' },
  { id: 'sepoy-mutiny', wiki: 'Indian Rebellion of 1857' },
  { id: 'imjin-war', wiki: 'Japanese invasions of Korea (1592–1598)' },
  { id: 'arab-spring', wiki: 'Arab Spring' },
  { id: 'human-genome', wiki: 'Human Genome Project' },
  { id: 'paris-agreement', wiki: 'Paris Agreement' },
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
    if (job.check) {
      file = job.check
    } else if (job.wiki) {
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
