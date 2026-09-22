// 用法: node tools/fetch-batch3c.mjs — 第三批C组：12 个替换/补漏（地图太干、logo 太弱、无主图）
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'kush-kingdom', search: 'Meroe pyramids Sudan' },
  { id: 'dai-viet', search: 'Temple of Literature Hanoi' },
  { id: 'gupta-empire', search: 'Gupta coin gold' },
  { id: 'aksum', search: 'Aksum obelisk' },
  { id: 'hittite', search: 'Hattusa Lion Gate' },
  { id: 'polynesia', search: 'Hokulea voyaging canoe' },
  { id: 'reform-opening', search: 'Shanghai Pudong skyline' },
  { id: 'beijing-olympics', search: 'Beijing National Stadium night' },
  { id: 'imjin-war', search: 'Turtle ship Geobukseon' },
  { id: 'world-wide-web', search: 'NeXT Computer first web server' },
  { id: 'human-genome', search: 'DNA sequencer laboratory' },
  { id: 'paris-agreement', search: 'COP21 plenary Paris' },
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
    const cands = await commonsSearch(job.search)
    await sleep(6000)
    const file = cands[0] || null
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
