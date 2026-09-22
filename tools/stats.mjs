import { ALL } from '../src/data/index.js'

const eraOf = (y) => (y < -800 ? '上古' : y < 500 ? '古典' : y < 1400 ? '中古' : y < 1800 ? '近代' : y < 2000 ? '现代' : '当代')
const era = {}
for (const e of ALL) era[eraOf(e.year)] = (era[eraOf(e.year)] || 0) + 1
console.log('年代分布:', JSON.stringify(era))
console.log('2000年后:', ALL.filter((e) => e.year >= 2000).map((e) => e.id).join(',') || '无')
console.log(
  '疑似女性人物:',
  ALL.filter((e) => e.category === 'figure' && /后|姬|夫人|女王|女|紫式部|居里|克利奥|哈特|泰戈|屠呦|圣母|贞德|武则天|慈禧|索菲|南丁/.test(e.name + e.kicker)).map((e) => e.name).join('、'),
)
const noRelated = ALL.filter((e) => !(e.related && e.related.length)).map((e) => e.id)
console.log('无关联档案:', noRelated.length ? noRelated.join(',') : '无')
const noFacts = ALL.filter((e) => !(e.facts && e.facts.length)).map((e) => e.id)
console.log('无事实卡:', noFacts.length ? noFacts.join(',') : '无')
