import { useEffect, useState } from 'react'

// 全量数据按需加载：首屏（年轮/时间轴画布/统计）走 slim-index，
// 正文卡片等需要完整档案时才拉起数据 chunk，全局只加载一次。
let promise
export function loadData() {
  if (!promise) promise = import('./index.js')
  return promise
}

export function useData() {
  const [mod, setMod] = useState(null)
  useEffect(() => {
    let on = true
    loadData().then((m) => { if (on) setMod(m) })
    return () => { on = false }
  }, [])
  return mod
}
