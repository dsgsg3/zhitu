import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { setPageMeta } from '../meta.js'
import { ALL, matchesKeyword, matchScore } from '../data/index.js'
import { CATEGORIES, REGIONS, ERAS, eraOf } from '../data/taxonomy.js'
import { EntityCard } from '../components/EntityCard.jsx'

export default function Browse() {
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat') || 'all'
  const region = params.get('region') || 'all'
  const era = params.get('era') || 'all'
  const [q, setQ] = useState('')
  useEffect(() => { setPageMeta('档案库', '分类 / 年代 / 地域三维组合筛选。') }, [])

  const set = (key, value) => {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete(key); else next.set(key, value)
    setParams(next, { replace: true })
  }

  const filtered = cat !== 'all' || region !== 'all' || era !== 'all' || q.trim() !== ''
  const clearAll = () => {
    setParams({}, { replace: true })
    setQ('')
  }

  const sorted = useMemo(() => {
    const kw = q.trim().toLowerCase()
    const out = ALL.filter((e) => {
      if (cat !== 'all' && e.category !== cat) return false
      if (region !== 'all' && e.region !== region) return false
      // era 来自 URL，非法值直接忽略，避免 ERAS.find 返回 undefined 时崩溃
      if (era !== 'all' && ERAS.some((x) => x.key === era) && eraOf(e.year) !== era) return false
      // 关键词走统一匹配（含拼音），与顶栏搜索一致
      if (kw && !matchesKeyword(e, kw)) return false
      return true
    })
    // 有关键词时按相关度排，无关键词时按时间排
    out.sort((a, b) => {
      if (kw) {
        const d = matchScore(a, kw) - matchScore(b, kw)
        if (d !== 0) return d
      }
      return a.year - b.year
    })
    return out
  }, [cat, region, era, q])

  return (
    <main className="browse-page">
      <div className="browse-head">
        <p className="eyebrow">档案库</p>
        <h1>历史档案库</h1>
        <p>按维度组合筛选：你想看哪个时代、哪片土地、哪种记忆？</p>
      </div>

      <div className="browse-controls">
        <div className="filter-row browse-search-row">
          <span className="filter-row-label">搜索</span>
          <input
            className="browse-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="在筛选结果中搜索，如：黄金、字母、陵墓…"
            aria-label="在档案库中搜索关键词"
          />
          {q && <button className="filter-chip" onClick={() => setQ('')}>✕</button>}
        </div>
        <div className="filter-row">
          <span className="filter-row-label">分类</span>
          <button className={`filter-chip cat ${cat === 'all' ? 'active' : ''}`} onClick={() => set('cat', 'all')}>全部</button>
          {CATEGORIES.map((c) => (
            <button key={c.key} className={`filter-chip cat ${cat === c.key ? 'active' : ''}`} style={{ '--cat': c.accent }} onClick={() => set('cat', c.key)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-row-label">年代</span>
          <button className={`filter-chip ${era === 'all' ? 'active' : ''}`} onClick={() => set('era', 'all')}>全部</button>
          {ERAS.map((e) => (
            <button key={e.key} className={`filter-chip ${era === e.key ? 'active' : ''}`} onClick={() => set('era', e.key)}>{e.label}</button>
          ))}
        </div>
        <div className="filter-row">
          <span className="filter-row-label">地域</span>
          <button className={`filter-chip ${region === 'all' ? 'active' : ''}`} onClick={() => set('region', 'all')}>全部</button>
          {REGIONS.map((r) => (
            <button key={r.key} className={`filter-chip ${region === r.key ? 'active' : ''}`} onClick={() => set('region', r.key)}>{r.label}</button>
          ))}
        </div>
      </div>

      <p className="browse-count">
        共 {sorted.length} 条 · 按时间排序
        {filtered && <button className="browse-clear" onClick={clearAll}>清除全部筛选</button>}
      </p>

      {sorted.length === 0 ? (
        <div className="browse-empty">
          <b>这个组合下暂时没有档案</b>
          换个筛选条件试试 — 历史总在别处等着你。
        </div>
      ) : (
        <div className="browse-grid">
          {sorted.map((e) => <EntityCard key={e.id} entity={e} />)}
        </div>
      )}
    </main>
  )
}
