// 用法: node tools/recheck-2.mjs — 温和复核两个被限流的 URL
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (const u of [
  'https://upload.wikimedia.org/wikipedia/commons/8/89/Zhuo_Wenjun.png',
  'https://upload.wikimedia.org/wikipedia/commons/5/5b/Mainz_Gutenbergdenkmal_2016_%28cropped%29.jpg',
]) {
  try {
    const r = await fetch(u, { method: 'HEAD' })
    console.log(r.status, u.slice(0, 60))
  } catch (e) {
    console.log('fail', u.slice(0, 60), String(e).slice(0, 60))
  }
  await sleep(8000)
}
