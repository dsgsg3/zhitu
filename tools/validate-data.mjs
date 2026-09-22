// 用法: npm run validate:data
// 全量校验档案数据：id 唯一且规范、分类/地域合法、年份与正文字段齐全（paragraphs 或 sections）、
// related 必须指向已存在的 id、sources 格式合法。新增档案前必须跑通；有问题时以非零码退出。
import { ALL } from '../src/data/index.js'
import { collections } from '../src/data/collections.js'
import { REGIONS, CATEGORIES } from '../src/data/taxonomy.js'

const regions = new Set(REGIONS.map((r) => r.key))
const cats = new Set(CATEGORIES.map((c) => c.key))
const ids = ALL.map((e) => e.id)
const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
console.log('total', ALL.length)
let bad = 0
if (dup.length) { console.log(`重复id: ${dup.join(',')}`); bad += dup.length }
else console.log('id无重复')
const byId = Object.fromEntries(ALL.map((e) => [e.id, e]))
for (const e of ALL) {
  if (!e.id || !/^[a-z0-9-]+$/.test(e.id)) { console.log(`id不规范: ${e.id}`); bad++ }
  if (!cats.has(e.category)) { console.log(`分类非法: ${e.id} ${e.category}`); bad++ }
  if (!regions.has(e.region)) { console.log(`地域非法: ${e.id} ${e.region}`); bad++ }
  if (e.year == null || typeof e.year !== 'number') { console.log(`年份缺失: ${e.id}`); bad++ }
  if (!e.name || !e.kicker || !e.summary || !(e.paragraphs?.length || e.sections?.length)) { console.log(`字段缺失: ${e.id}`); bad++ }
  for (const sec of e.sections || []) {
    if (!sec.heading || !sec.paragraphs?.length) { console.log(`小节字段缺失: ${e.id} / ${sec.heading || '?'}`); bad++ }
  }
  for (const r of e.related || []) {
    if (!byId[r]) { console.log(`关联缺失: ${e.id} -> ${r}`); bad++ }
  }
  for (const s of e.sources || []) {
    if (!s.label || !/^https?:\/\//.test(s.url || '')) { console.log(`出处格式非法: ${e.id}`); bad++ }
  }
}
const cids = collections.map((c) => c.id)
const cdup = cids.filter((id, i) => cids.indexOf(id) !== i)
if (cdup.length) { console.log(`专题id重复: ${cdup.join(',')}`); bad += cdup.length }
for (const c of collections) {
  if (!c.id || !c.name || !c.entries?.length) { console.log(`专题字段缺失: ${c.id}`); bad++ }
  for (const en of c.entries || []) {
    if (!byId[en.id]) { console.log(`专题关联缺失: ${c.id} -> ${en.id}`); bad++ }
    if (!en.note) { console.log(`专题导读缺失: ${c.id} -> ${en.id}`); bad++ }
  }
}
if (bad > 0) {
  console.log(`发现 ${bad} 个问题`)
  process.exit(1)
}
console.log('全部校验通过')
