// 用法: node tools/fetch-batch3d.mjs — 3 个候选复核（游行 crowd、GPL 龟船、DNA 损伤图不理想）
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const FILES = [
  ['aksum', 'Der Obelisk von Aksum.JPG'],
  ['imjin-war', 'Korea-Tongyeong Port-Turtle ship replica-01.jpg'],
  ['human-genome', 'Revolocity DNA sequencer.jpg'],
]

async function getJson(url) {
  const r = await fetch(url, { headers: UA })
  return JSON.parse(await r.text())
}

for (const [id, file] of FILES) {
  const u =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=800&formatversion=2&titles=' +
    encodeURIComponent('File:' + file)
  try {
    const j = await getJson(u)
    const info = j?.query?.pages?.[0]?.imageinfo?.[0]
    const meta = info?.extmetadata || {}
    console.log(JSON.stringify({
      id,
      file,
      thumb800: clean(info?.thumburl),
      license: stripHtml(meta.LicenseShortName?.value) || stripHtml(meta.License?.value),
      author: stripHtml(meta.Artist?.value).slice(0, 100),
    }))
  } catch (e) {
    console.log(JSON.stringify({ id, file, error: String(e).slice(0, 120) }))
  }
  await sleep(6000)
}
