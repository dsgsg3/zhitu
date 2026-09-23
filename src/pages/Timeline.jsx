import { useMemo, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { setPageMeta } from '../meta.js'
import { SLIM } from '../data/slim-index.js'
import { useData } from '../data/useData.js'
import { CATEGORIES, ERAS, eraOf, formatYear } from '../data/taxonomy.js'
import { useFootprint, isRead, isFav } from '../store.js'

// 时代长廊 · 横向版：时代导航带 + 单时代横向年代带。
// 卡片按年份定位（时代内线性），碰撞自动右推保序；上下交替减半密度；已读淡化、收藏亮星。
const anchorYear = (e) => (e.range ? (e.range[0] + (e.range[1] ?? e.range[0])) / 2 : e.year)
const CARD_W = 172
const MIN_GAP = 24

function layoutBand(items, width) {
  const pad = 110
  const usable = Math.max(400, width - pad * 2)
  const y0 = items.length ? items[0].y : 0
  const y1 = items.length ? items[items.length - 1].y : 1
  const span = Math.max(1, y1 - y0)
  const placed = items.map((it, idx) => ({
    ...it,
    x: pad + ((it.y - y0) / span) * usable,
    side: idx % 2 === 0 ? 'above' : 'below',
  }))
  // 同侧碰撞推挤（保chrono顺序，只向右）
  for (const side of ['above', 'below']) {
    let lastRight = -Infinity
    for (const p of placed) {
      if (p.side !== side) continue
      const left = p.x - CARD_W / 2
      if (left < lastRight + MIN_GAP) p.x = lastRight + MIN_GAP + CARD_W / 2
      lastRight = p.x + CARD_W / 2
    }
  }
  return placed
}

export default function Timeline() {
  const [eraKey, setEraKey] = useState(ERAS[0].key)
  const [cat, setCat] = useState('all')
  const [favOnly, setFavOnly] = useState(false)
  const mod = useData()
  const snap = useFootprint()
  const scrollRef = useRef(null)
  const dragRef = useRef(null)
  const [bandW, setBandW] = useState(1400)
  useEffect(() => { setPageMeta('时间轴', '选定时代，横向漫游。') }, [])

  const eraIdx = Math.max(0, ERAS.findIndex((e) => e.key === eraKey))
  const era = ERAS[eraIdx]

  const eraCounts = useMemo(() => {
    const c = {}
    for (const e of SLIM) {
      const k = e.era || eraOf(e.year)
      c[k] = (c[k] || 0) + 1
    }
    return c
  }, [])

  const mod2 = mod
  const rows = useMemo(() => {
    if (!mod2) return []
    return mod2.ALL
      .filter((e) => eraOf(e.year) === eraKey)
      .filter((e) => cat === 'all' || e.category === cat)
      .filter((e) => !favOnly || isFav(e.id, snap))
      .map((e) => ({ ...e, y: Math.round(anchorYear(e)) }))
      .sort((a, b) => a.y - b.y)
  }, [mod2, eraKey, cat, favOnly, snap])

  const placed = useMemo(() => layoutBand(rows, bandW), [rows, bandW])

  const catCounts = useMemo(() => {
    const c = {}
    if (!mod2) return c
    for (const e of mod2.ALL) {
      if (eraOf(e.year) !== eraKey) continue
      c[e.category] = (c[e.category] || 0) + 1
    }
    return c
  }, [mod2, eraKey])

  // 容器宽度跟随视口，条目多时自动扩展内容宽（横向滚动）
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBandW(Math.max(1200, el.clientWidth)))
    ro.observe(el)
    setBandW(Math.max(1200, el.clientWidth))
    return () => ro.disconnect()
  }, [])

  // 鼠标拖拽平移（触摸设备走原生滚动）
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollRef.current
    if (!el) return
    dragRef.current = { x: e.clientX, left: el.scrollLeft }
    el.classList.add('dragging')
  }
  const onPointerMove = (e) => {
    if (!dragRef.current) return
    const el = scrollRef.current
    el.scrollLeft = dragRef.current.left - (e.clientX - dragRef.current.x)
  }
  const endDrag = () => {
    dragRef.current = null
    if (scrollRef.current) scrollRef.current.classList.remove('dragging')
  }

  const eraIdxN = Math.max(0, ERAS.findIndex((e) => e.key === eraKey))
  const prev = eraIdxN > 0 ? ERAS[eraIdxN - 1] : null
  const next = eraIdxN < ERAS.length - 1 ? ERAS[eraIdxN + 1] : null
  const catByKey = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]))

  return (
    <main className='timeline-page'>
      <div className='timeline-hero'>
        <p className='eyebrow'>时间轴</p>
        <h1>时代长廊</h1>
        <p>选一个时代，沿年份横向走一遍。</p>
      </div>

      <div className='tl-era-nav'>
        {ERAS.map((e) => (
          <button
            key={e.key}
            className={'tl-era-seg' + (e.key === eraKey ? ' active' : '')}
            onClick={() => { setEraKey(e.key); setCat('all'); setFavOnly(false) }}
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
          <button className={'tl-cat-chip' + (cat === 'all' ? ' active' : '')} onClick={() => setCat('all')}>全部 {eraCounts[eraKey] || 0}</button>
          {CATEGORIES.map((c) => (
            <button key={c.key} className={'tl-cat-chip' + (cat === c.key ? ' active' : '')} onClick={() => setCat(c.key)}>
              {c.icon} {c.short} {catCounts[c.key] || 0}
            </button>
          ))}
          <button className={'tl-cat-chip' + (favOnly ? ' active' : '')} onClick={() => setFavOnly((v) => !v)}>★ 只看收藏</button>
        </div>
      </div>

      <div
        className={'hband-scroll' + (dragRef.current ? ' dragging' : '')}
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div className='hband' style={{ width: bandW + 220 }}>
          {!mod && <div className='route-loading'>档案载入中…</div>}
          {mod && rows.length === 0 && <p className='hband-empty'>该筛选下暂无条目。</p>}
          {mod && rows.length > 0 && (
            <div className='hband-axis' style={{ top: 236 }} />
          )}
          {placed.map((p) => {
            const c = catByKey[p.category]
            const read = isRead(p.id, snap)
            const fav = isFav(p.id, snap)
            const above = p.side === 'above'
            return (
              <div
                key={p.id}
                className={'hband-card' + (read ? ' read' : '')}
                style={above
                  ? { left: p.x - CARD_W / 2, bottom: 236 + 26 }
                  : { left: p.x - CARD_W / 2, top: 236 + 26 }}
              >
                <Link to={'/entity/' + p.id} className='hband-link'>
                  <span className='hband-year'>{formatYear(p.y)}</span>
                  <span className='hband-name'>
                    <i className='hband-catdot' style={{ background: c.accent }} />
                    {p.name}
                    {fav ? ' ★' : ''}
                  </span>
                  <span className='hband-kicker'>{p.kicker || ''}</span>
                </Link>
              </div>
            )
          })}
          {placed.map((p) => (
            <div key={p.id + '-stem'} className={'hband-stem ' + p.side} style={{ left: p.x, [p.side === 'above' ? 'bottom' : 'top']: 236 }} />
          ))}
          {placed.map((p) => {
            const c = catByKey[p.category]
            return (
              <span key={p.id + '-dot'} className='hband-dot' style={{ left: p.x, top: 236, background: c.accent }} />
            )
          })}
        </div>
      </div>
      {mod && rows.length > 0 && <p className='hband-hint'>← 拖动或滚动查看 → · 悬停卡片可读 · 点击进入档案</p>}

      <div className='tl-era-pager'>
        {prev
          ? <button className='tl-pager-btn' onClick={() => { setEraKey(prev.key); setCat('all'); setFavOnly(false) }}>‹ {prev.short} · {prev.label}</button>
          : <span />}
        {next
          ? <button className='tl-pager-btn' onClick={() => { setEraKey(next.key); setCat('all'); setFavOnly(false) }}>{next.short} · {next.label} ›</button>
          : <span />}
      </div>
    </main>
  )
}