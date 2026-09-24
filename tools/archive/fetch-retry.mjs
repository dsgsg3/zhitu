// 用法: node tools/fetch-retry.mjs
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clean = (u = '') => u.split('?')[0]
const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()

const JOBS = [
  ['cleopatra', 'Cleopatra'],
  ['mongol-empire', 'Mongol Empire'],
  ['marie-curie', 'Marie Curie'],
]

for (const [id, title] of JOBS) {
  await sleep(5000)
  const u1 =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=name&pithumbsize=800&formatversion=2&titles=' +
    encodeURIComponent(title)
  const j1 = await (await fetch(u1, { headers: UA })).json()
  const file = j1?.query?.pages?.[0]?.pageimage
  if (!file) {
    console.log(JSON.stringify({ id, error: 'no-file' }))
    continue
  }
  await sleep(5000)
  const u2 =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=800&formatversion=2&titles=' +
    encodeURIComponent('File:' + file)
  const j2 = await (await fetch(u2, { headers: UA })).json()
  const info = j2?.query?.pages?.[0]?.imageinfo?.[0]
  const meta = info?.extmetadata || {}
  console.log(
    JSON.stringify({
      id,
      file,
      thumb800: clean(info?.thumburl),
      license: stripHtml(meta.LicenseShortName?.value) || stripHtml(meta.License?.value),
      author: stripHtml(meta.Artist?.value).slice(0, 120),
    }),
  )
}
