// 用法: node tools/fetch-batch2.mjs
// 第二批 40 张：19 条新增弱势区域 + 21 条重要旧档案
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  // --- 新增 19 条（taj-mahal 已有图）---
  { id: 'mughal-empire', wiki: 'Mughal Empire' },
  { id: 'carthage', wiki: 'Carthage' },
  { id: 'mali-empire', search: 'Great Mosque of Djenne' },
  { id: 'olmec', wiki: 'Olmec' },
  { id: 'joseon-dynasty', wiki: 'Joseon' },
  { id: 'edo-japan', wiki: 'Edo period' },
  { id: 'hannibal', wiki: 'Hannibal' },
  { id: 'mansa-musa', wiki: 'Mansa Musa' },
  { id: 'simon-bolivar', wiki: 'Simón Bolívar' },
  { id: 'tagore', wiki: 'Rabindranath Tagore' },
  { id: 'hokusai', search: 'Great Wave off Kanagawa' },
  { id: 'ajanta-caves', wiki: 'Ajanta Caves' },
  { id: 'great-zimbabwe', wiki: 'Great Zimbabwe' },
  { id: 'machu-picchu', wiki: 'Machu Picchu' },
  { id: 'hangul-letter', wiki: 'Hunminjeongeum' },
  { id: 'zero-concept', search: 'Bakhshali manuscript' },
  { id: 'chola-ocean-trade', wiki: 'Chola dynasty' },
  { id: 'american-independence', wiki: 'American Revolutionary War' },
  { id: 'phoenician-alphabet', wiki: 'Phoenician alphabet' },
  // --- 旧档案 21 条 ---
  { id: 'ancient-egypt', wiki: 'Ancient Egypt' },
  { id: 'mesopotamia', wiki: 'Mesopotamia' },
  { id: 'greek-city-states', wiki: 'Ancient Greece' },
  { id: 'byzantine', wiki: 'Byzantine Empire' },
  { id: 'qin-shihuang', wiki: 'Qin Shi Huang' },
  { id: 'han-wudi', wiki: 'Emperor Wu of Han' },
  { id: 'li-bai', wiki: 'Li Bai' },
  { id: 'du-fu', wiki: 'Du Fu' },
  { id: 'xuanzang', wiki: 'Xuanzang' },
  { id: 'zheng-he', wiki: 'Zheng He' },
  { id: 'marco-polo', wiki: 'Marco Polo' },
  { id: 'gutenberg', wiki: 'Johannes Gutenberg' },
  { id: 'newton', wiki: 'Isaac Newton' },
  { id: 'einstein', wiki: 'Albert Einstein' },
  { id: 'gandhi', wiki: 'Mahatma Gandhi' },
  { id: 'ashoka', wiki: 'Ashoka' },
  { id: 'gautama-buddha', wiki: 'Gautama Buddha' },
  { id: 'great-wall', wiki: 'Great Wall of China' },
  { id: 'dunhuang-library-cave', wiki: 'Mogao Caves' },
  { id: 'hagia-sophia', wiki: 'Hagia Sophia' },
  { id: 'columbus', wiki: 'Christopher Columbus' },
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
      await sleep(2500)
    } else {
      candidates = await commonsSearch(job.search)
      file = candidates[0] || null
      await sleep(2500)
    }
    if (!file) {
      out.push({ ...job, error: 'no-file', candidates })
      continue
    }
    const m = await commonsMeta(file)
    await sleep(2500)
    out.push({ ...job, file, candidates: candidates.slice(1, 4), ...(m || { error: 'no-meta' }) })
  } catch (e) {
    out.push({ ...job, error: String(e).slice(0, 160) })
    await sleep(5000)
  }
}
console.log(JSON.stringify(out, null, 2))
