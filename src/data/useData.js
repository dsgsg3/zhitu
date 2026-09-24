import { useEffect, useState } from 'react'
import { SLIM } from './slim-index.js'

// 两级数据加载：
// - slimIndex：同步可用的精简索引（卡片字段 + related），列表/地图/时间轴/关联卡足够
// - loadData()：全量正文 chunk（4 个分类文件并行），详情页正文与正文级搜索时拉起
let promise
export function loadData() {
  if (!promise) promise = import('./index.js')
  return promise
}

const slimById = Object.fromEntries(SLIM.map((e) => [e.id, e]))

// 精简索引的同步查询：详情页 related、sameEra 等只用卡片字段，无需等全量
export const slimIndex = { SLIM, byId: slimById }

export function useData() {
  const [mod, setMod] = useState(null)
  useEffect(() => {
    let on = true
    loadData().then((m) => { if (on) setMod(m) })
    return () => { on = false }
  }, [])
  return mod
}
