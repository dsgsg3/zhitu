import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { setPageMeta } from '../meta.js'
import { SLIM } from '../data/slim-index.js'
import { useData } from '../data/useData.js'
import { CATEGORIES, ERAS, eraOf, formatYear } from '../data/taxonomy.js'

// 时代长廊：六个时代等宽导航 + 垂直时间线。永不重叠，天然适配手机。
const anchorYear = (e) => (e.range ? (e.range[0] + (e.range[1] ?? e.range[0])) / 2 : e.year)

export default function Timeline() {
  const [eraKey, setEraKey] = useState(ERAS[0].key)
  const [cat, setCat] = useState('all')
  const mod = useData()
  useEffect(() => { setPageMeta('时间轴', '六个时代，一条长廊。选择你的入口。') }, [])

  // 时代带计数（来自 SLIM，瞬时可得）
  const eraCounts = useMemo(() => {
    const c = {}
    for (const e of SLIM) {
      const k = e.era || eraOf(e.year)
      c[k] = (c[k] || 0) + 1
    }
    return c
  }, [])

  const eraIdx = Math.max(0, ERAS.findIndex((e) => e.key === eraKey))
  const era = ERAS[eraIdx]

  // 当前时代的全量档案（懒加载 chunk 到了再渲染行）
  const rows = useMemo(() => {
    if (!mod) return []
    return mod.ALL
      .filter((e) => eraOf(e.year) === eraKey)
      .filter((e) => cat === 'all' || e.category === cat)
      .sort((a, b) => anchorYear(a) - anchorYear(b))
  }, [mod, eraKey, cat])

  const catCounts = useMemo(() => {
    const c = {}
    if (!mod) return c
    for (const e of mod.ALL) {
      if (eraOf(e.year) !== eraKey) continue
      c[e.category] = (c[e.category] || 0) + 1
    }
    return c
  }, [mod, eraKey])

  const prev = eraIdx > 0 ? ERAS[eraIdx - 1] : null
  const next = eraIdx < ERAS.length - 1 ? ERAS[eraIdx + 1] : null
  const catByKey = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]))

  let lastYear = null

  return (
    <main className='timeline-page'>
      <div className='timeline-hero'>
        <p className='eyebrow'>时间轴</p>
        <h1>时代长廊</h1>
        <p>六个时代，一条长廊。选一个入口，沿年份走下去。</p>
      </div>

      <div className='tl-era-nav'>
        {ERAS.map((e) => (
          <button
            key={e.key}
            className={'tl-era-seg' + (e.key === eraKey ? ' active' : '')}
            onClick={() => { setEraKey(e.key); setCat('all') }}
          >
            <span className='seg-short'>{e.short}</span>
            <span className='seg-range'>{formatYear(e.range[0])} — {formatYear(e.range[1] - 1)}</span>
            <span className='seg-count'>{eraCounts[e.key] || 0} 条</span>
          </button>
        ))}
      </div>

      <div className='tl-era-head'>
        <p className='eyebrow'>{era.label}</p>
        <h2>{formatYear(era.range[0])} — {formatYear(era.range[1] - 1)}</h2>
        <div className='tl-cat-row'>
          <button className={'tl-cat-chip' + (cat === 'all' ? ' active' : '')} onClick={() => setCat('all')}>全部 {catCounts.all ? '' : ''}{eraCounts[eraKey] || 0}</button>
          {CATEGORIES.map((c) => (
            <button key={c.key} className={'tl-cat-chip' + (cat === c.key ? ' active' : '')} onClick={() => setCat(c.key)}>
              {c.icon} {c.short} {catCounts[c.key] || 0}
            </button>
          ))}
        </div>
      </div>

      <div className='spine-wrap'>
        <div className='spine-line' aria-hidden='true' />
        {!mod && <div className='route-loading'>档案载入中…</div>}
        {mod && rows.length === 0 && <p className='spine-empty'>该时代暂无此类条目——换个类别试试。</p>}
        {rows.map((e) => {
          const c = catByKey[e.category]
          const y = Math.round(anchorYear(e))
          const showYear = y !== lastYear
          lastYear = y
          return (
            <Link key={e.id} to={'/entity/' + e.id} className='spine-row' data-cat={e.category}>
              <span className='spine-year'>{showYear ? formatYear(y) : ''}</span>
              <span className='spine-dot' style={{ background: c.accent }} />
              <span className='spine-body'>
                <span className='spine-name'>{c.icon} {e.name}</span>
                {e.foreign && <span className='spine-foreign'>{e.foreign}</span>}
              </span>
              <span className='spine-go'>→</span>
            </Link>
          )
        })}
      </div>

      <div className='tl-era-pager'>
        {prev
          ? <button className='tl-pager-btn' onClick={() => { setEraKey(prev.key); setCat('all') }}>‹ {prev.short} · {prev.label}</button>
          : <span />}
        {next
          ? <button className='tl-pager-btn' onClick={() => { setEraKey(next.key); setCat('all') }}>{next.short} · {next.label} ›</button>
          : <span />}
      </div>
    </main>
  )
}