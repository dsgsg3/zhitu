// 用法: node tools/fetch-batch4d.mjs — 第四批D组：人物上半 19
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  { id: 'zhang-qian', wiki: 'Zhang Qian' },
  { id: 'simaqian', wiki: 'Sima Qian' },
  { id: 'suleiman', wiki: 'Suleiman the Magnificent' },
  { id: 'li-shizhen', wiki: 'Li Shizhen' },
  { id: 'li-si', wiki: 'Li Si' },
  { id: 'sima-xiangru', wiki: 'Sima Xiangru' },
  { id: 'cai-lun', wiki: 'Cai Lun' },
  { id: 'socrates', wiki: 'Socrates' },
  { id: 'plato', wiki: 'Plato' },
  { id: 'aristotle', wiki: 'Aristotle' },
  { id: 'alexander', wiki: 'Alexander the Great' },
  { id: 'herodotus', wiki: 'Herodotus' },
  { id: 'hatshepsut', wiki: 'Hatshepsut' },
  { id: 'euclid', wiki: 'Euclid' },
  { id: 'archimedes', wiki: 'Archimedes' },
  { id: 'ibn-sina', wiki: 'Avicenna' },
  { id: 'al-khwarizmi', wiki: 'Al-Khwarizmi' },
  { id: 'ibn-battuta', wiki: 'Ibn Battuta' },
  { id: 'dante', wiki: 'Dante Alighieri' },
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
