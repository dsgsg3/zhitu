// 用法: node fetch-images-new.mjs <batchDir>
// 按清单 wikiTitle 抓 en.wikipedia 主图 → Commons 元数据，逐条写 <batchDir>/images/<id>.json
import fs from 'node:fs'
const batchDir = process.argv[2]
const manifest = JSON.parse(fs.readFileSync(batchDir + '/manifest.json', 'utf8'))
const UA = { 'User-Agent': 'guanshi-history-site/1.0 (personal learning project)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const outDir = batchDir + '/images'
fs.mkdirSync(outDir, { recursive: true })
const strip = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim()
const results = []
for (const t of manifest) {
  const outFile = outDir + '/' + t.id + '.json'
  if (fs.existsSync(outFile)) { results.push({ id: t.id, ok: true, cached: true }); continue }
  try {
    const u1 = 'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=pageimages&piprop=original%7Cthumbnail&pithumbsize=1000&redirects=1&titles=' + encodeURIComponent(t.wikiTitle)
    const page = (await (await fetch(u1, { headers: UA })).json())?.query?.pages?.[0]
    const src = page?.thumbnail?.source || page?.original?.source
    if (!src) { results.push({ id: t.id, ok: false, reason: 'no-pageimage' }); console.log('MISS', t.id); await sleep(8000); continue }
    let fileTitle = 'File:' + decodeURIComponent(src.split('/').pop()).replace(/\?/g, '')
    const u2 = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=960&titles=' + encodeURIComponent(fileTitle)
    const info = (await (await fetch(u2, { headers: UA })).json())?.query?.pages?.[0]?.imageinfo?.[0]
    const m = info?.extmetadata || {}
    const item = {
      id: t.id,
      file: fileTitle.slice(5),
      thumb800: (info?.thumburl || src).split('?')[0],
      license: strip(m.LicenseShortName?.value || m.License?.value),
      author: strip(m.Artist?.value).slice(0, 120),
      page: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(fileTitle.replace(/ /g, '_')),
    }
    fs.writeFileSync(outFile, JSON.stringify(item, null, 1))
    results.push({ id: t.id, ok: true })
    console.log('OK  ', t.id, '->', item.file.slice(0, 50))
  } catch (e) {
    results.push({ id: t.id, ok: false, reason: String(e).slice(0, 80) })
    console.log('FAIL', t.id, String(e).slice(0, 60))
  }
  await sleep(11000)
}
fs.writeFileSync(batchDir + '/fetch-log.json', JSON.stringify(results, null, 1))
console.log('fetched', results.filter((r) => r.ok).length, '/', results.length)
