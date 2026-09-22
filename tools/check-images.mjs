// 用法: node tools/check-images.mjs
// 校验所有 image 字段：src 可达 + page 可达 + 作者/许可证非空
import { ALL } from '../src/data/index.js'

const withImg = ALL.filter((e) => e.image)
console.log(`有图 ${withImg.length} / ${ALL.length}`)
let bad = 0
for (const e of withImg) {
  const { src, page, author, license } = e.image
  if (!src || !page || !author || !license) {
    console.log(`字段缺失: ${e.id}`)
    bad++
    continue
  }
  for (const [k, url] of [['src', src], ['page', page]]) {
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'follow' })
      if (!r.ok) {
        console.log(`不可达 ${r.status}: ${e.id} ${k} ${url.slice(0, 80)}`)
        bad++
      }
    } catch (err) {
      console.log(`请求失败: ${e.id} ${k} ${String(err).slice(0, 80)}`)
      bad++
    }
  }
}
console.log(bad === 0 ? '全部通过' : `发现 ${bad} 个问题`)
