import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setPageMeta } from '../meta.js'
import { SLIM } from '../data/slim-index.js'
import { useData } from '../data/useData.js'
import { CATEGORIES, ERAS, eraOf, formatYear } from '../data/taxonomy.js'
import { EntityCard } from '../components/EntityCard.jsx'

const MIN_YEAR = -3500
const MAX_YEAR = 2050
const SPAN = MAX_YEAR - MIN_YEAR

// 时间轴布局：按时间排序后错开行位，避免重叠
// 车道溢出时按 id 哈希固定分配，保证同一视口每次渲染结果一致
function laneHash(id) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 6
}
function layout(ents, width) {
  const sorted = [...ents].sort((a, b) => a.year - b.year)
  const lanes = []
  const placed = []
  const MIN_GAP = 46 // px 最小水平间距
  for (const e of sorted) {
    const x = ((e.year - MIN_YEAR) / SPAN) * width
    let lane = 0
    while (lane < 6 && placed.some((p) => p.lane === lane && Math.abs(p.x - x) < MIN_GAP)) lane++
    if (lane >= 6) lane = laneHash(e.id)
    placed.push({ id: e.id, x, lane })
    if (!lanes[lane]) lanes[lane] = []
    lanes[lane].push({ entity: e, x })
  }
  return lanes
}

// 底部卡片网格：需要完整档案（摘要/配图），按需加载，画布与光点始终瞬时可用
function TimelineResults({ slim }) {
  const mod = useData()
  if (!mod) return <div className="route-loading">档案载入中…</div>
  return (
    <div className="tl-results-grid">
      {slim.slice(0, 12).map((s) => {
        const e = mod.byId[s.id]
        return e ? <EntityCard key={e.id} entity={e} /> : null
      })}
    </div>
  )
}

export default function Timeline() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const [width, setWidth] = useState(1200)
  const [offset, setOffset] = useState(() => {
    // 初始定位到公元前后
    return 0.42
  })
  const [selectedEra, setSelectedEra] = useState(null)
  const [scale, setScale] = useState(2.2) // 每年多少像素的倍率基准，可缩放
  const dragRef = useRef(null)
  useEffect(() => { setPageMeta('时间轴', '左右拖动，漫游五千五百年。') }, [])
  // 拖动结束时记录是否真的移动过，用于抑制拖拽尾巴上的误点击
  const movedRef = useRef(false)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // 拖拽
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const down = (e) => {
      dragRef.current = { startX: e.clientX, startOffset: offset, moved: false }
    }
    const move = (e) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      if (Math.abs(dx) > 4) dragRef.current.moved = true
      const total = SPAN_SCALE()
      setOffset(Math.max(0, Math.min(1 - width / total, dragRef.current.startOffset - dx / total)))
    }
    const up = () => {
      if (dragRef.current) movedRef.current = dragRef.current.moved
      dragRef.current = null
    }
    el.addEventListener('mousedown', down)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    const touchDown = (e) => { dragRef.current = { startX: e.touches[0].clientX, startOffset: offset, moved: false } }
    const touchMove = (e) => {
      if (!dragRef.current) return
      const dx = e.touches[0].clientX - dragRef.current.startX
      if (Math.abs(dx) > 4) dragRef.current.moved = true
      const total = SPAN_SCALE()
      setOffset(Math.max(0, Math.min(1 - width / total, dragRef.current.startOffset - dx / total)))
    }
    const touchUp = () => {
      if (dragRef.current) movedRef.current = dragRef.current.moved
      dragRef.current = null
    }
    el.addEventListener('touchstart', touchDown, { passive: true })
    el.addEventListener('touchmove', touchMove, { passive: true })
    el.addEventListener('touchend', touchUp)
    return () => {
      el.removeEventListener('mousedown', down)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      el.removeEventListener('touchstart', touchDown)
      el.removeEventListener('touchmove', touchMove)
      el.removeEventListener('touchend', touchUp)
    }
  }, [offset, width, scale])

  const SCALE = scale // 每年多少像素的倍率基准
  function SPAN_SCALE() {
    return SPAN * SCALE * 0.35 // px per year
  }

  // 键盘漫游：←→ 平移，+− 缩放，0 回到公元元年
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches('input, textarea')) return
      const total = SPAN_SCALE()
      const step = (width / total) * 0.2
      if (e.key === 'ArrowLeft') setOffset((o) => Math.max(0, Math.min(1 - width / total, o - step)))
      else if (e.key === 'ArrowRight') setOffset((o) => Math.max(0, Math.min(1 - width / total, o + step)))
      else if (e.key === '+' || e.key === '=') setScale((s) => Math.min(5, +(s + 0.4).toFixed(2)))
      else if (e.key === '-') setScale((s) => Math.max(1, +(s - 0.4).toFixed(2)))
      else if (e.key === '0') goYear(0)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [width, scale])

  // 把指定年份移到视口中央
  function goYear(y) {
    const total = SPAN_SCALE()
    const frac = (y - MIN_YEAR) / SPAN - (width / total) / 2
    setOffset(Math.max(0, Math.min(1 - width / total, frac)))
    setSelectedEra(null)
  }

  const pxPerYear = SPAN * SCALE * 0.35 / SPAN // = SCALE*0.35 ≈ 0.77 px/yr
  const totalPx = SPAN * pxPerYear
  const viewYears = width / pxPerYear

  const yearToX = (y) => ((y - MIN_YEAR) * pxPerYear) - offset * totalPx
  const xToYear = (x) => (x + offset * totalPx) / pxPerYear + MIN_YEAR

  // 显示的实体（当前视口 + 年代过滤）—— 精简索引即可，画布无需正文
  const visible = useMemo(() => {
    const lo = xToYear(-80), hi = xToYear(width + 80)
    return SLIM.filter((e) => {
      if (selectedEra) return e.era === selectedEra
      const ey = e.range ? e.range[0] : e.year
      return ey >= lo && ey <= hi
    })
  }, [width, offset, selectedEra])

  const lanes = useMemo(() => (visible.length ? layout(visible, totalPx) : []), [visible, totalPx])
  const resultEntities = selectedEra
    ? SLIM.filter((e) => e.era === selectedEra)
    : visible.slice(0, 24)

  // 刻度
  const ticks = useMemo(() => {
    const step = viewYears > 2000 ? 500 : viewYears > 800 ? 200 : viewYears > 300 ? 100 : 50
    const out = []
    const lo = xToYear(0), hi = xToYear(width)
    for (let y = Math.floor(lo / step) * step; y <= hi; y += step) out.push(y)
    return out
  }, [viewYears, offset, width])

  const CAT_COLOR = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.accent]))

  return (
    <main className="timeline-page">
      <div className="timeline-hero">
        <p className="eyebrow">时间之线</p>
        <h1>时间的长河</h1>
        <p>左右拖动，漫游五千五百年。点击轴上的光点，直接跳进那段历史。</p>
      </div>

      <div className="tl-wrap">
        <svg ref={canvasRef} className="tl-canvas" height="460">
          {/* 时代背景带 */}
          {ERAS.map((era, i) => {
            const x1 = yearToX(era.range[0]), x2 = yearToX(era.range[1])
            if (x2 < -50 || x1 > width + 50) return null
            return (
              <g key={era.key}>
                <rect x={x1} y={0} width={x2 - x1} height="460" fill={i % 2 ? 'rgba(27,26,23,.035)' : 'transparent'} />
                <text x={(x1 + x2) / 2} y="30" textAnchor="middle" fill="var(--ink-faint)" fontSize="11" letterSpacing="2">{era.label}</text>
              </g>
            )
          })}
          {/* 公元线 */}
          {(() => {
            const x = yearToX(0)
            if (x < -10 || x > width + 10) return null
            return <g><line x1={x} y1="0" x2={x} y2="460" stroke="var(--gold)" strokeWidth="1" opacity=".5" /><text x={x + 6} y="446" fill="var(--gold)" fontSize="10" opacity=".8">公元元年</text></g>
          })()}
          {/* 主轴 */}
          <line x1="0" y1="430" x2={width} y2="430" stroke="var(--line-strong)" strokeWidth="1" />
          {/* 刻度 */}
          {ticks.map((y) => {
            const x = yearToX(y)
            return (
              <g key={y}>
                <line x1={x} y1={424} x2={x} y2={436} stroke="var(--ink-faint)" />
                <text x={x} y={452} textAnchor="middle" fill="var(--ink-faint)" fontSize="10">{formatYear(y)}</text>
              </g>
            )
          })}
          {/* 实体节点 */}
          {lanes.map((lane, li) =>
            lane.map(({ entity, x }) => {
              // layout() 算的是绝对坐标，这里减去滚动量才是屏幕坐标
              const cx = x - offset * totalPx
              if (cx < -60 || cx > width + 60) return null
              const color = CAT_COLOR[entity.category]
              const cy = 430 - 42 - li * 56
              const open = () => {
                if (movedRef.current) { movedRef.current = false; return }
                navigate(`/entity/${entity.id}`)
              }
              const label = `${entity.name}，${formatYear(entity.range ? entity.range[0] : entity.year)}`
              return (
                <g
                  key={entity.id}
                  style={{ cursor: 'pointer' }}
                  onClick={open}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      navigate(`/entity/${entity.id}`)
                    }
                  }}
                >
                  {/* 隐形点击区：视觉圆点仅 6px，触摸目标扩到 32px */}
                  <circle cx={cx} cy={cy} r="16" fill="transparent" />
                  <line x1={cx} y1={430} x2={cx} y2={cy + 10} stroke={color} strokeWidth="1" opacity=".35" />
                  <circle cx={cx} cy={cy} r="6" fill="var(--bg)" stroke={color} strokeWidth="2" />
                  <circle cx={cx} cy={cy} r="2.4" fill={color} />
                  <text x={cx} y={cy - 12} textAnchor="middle" fill="var(--ink)" fontSize="12" fontFamily="var(--serif)">{entity.name}</text>
                  <text x={cx} y={cy + 24} textAnchor="middle" fill="var(--ink-faint)" fontSize="9">{formatYear(entity.range ? entity.range[0] : entity.year)}</text>
                </g>
              )
            }),
          )}
        </svg>
        <p className="tl-hint">← 拖 动 漫 游 →</p>

        <div className="tl-tools">
          <button className="era-chip" onClick={() => setScale((s) => Math.max(1, +(s - 0.4).toFixed(2)))} aria-label="缩小">− 缩小</button>
          <button className="era-chip" onClick={() => setScale((s) => Math.min(5, +(s + 0.4).toFixed(2)))} aria-label="放大">+ 放大</button>
          <button className="era-chip" onClick={() => goYear(0)}>回到公元元年</button>
          <span className="tl-keys">键盘 ← → 平移 · + − 缩放 · 0 回元年</span>
        </div>

        <div className="tl-era-row">
          <button className={`era-chip ${!selectedEra ? 'active' : ''}`} onClick={() => setSelectedEra(null)}>全部</button>
          {ERAS.map((e) => (
            <button key={e.key} className={`era-chip ${selectedEra === e.key ? 'active' : ''}`} onClick={() => setSelectedEra(e.key)}>{e.short}</button>
          ))}
        </div>
      </div>

      <div className="tl-legend">
        {CATEGORIES.map((c) => (
          <span key={c.key}><i style={{ background: c.accent }} />{c.label}</span>
        ))}
      </div>

      <div className="tl-results">
        <div className="tl-results-head">
          <h3>{selectedEra ? `${ERAS.find((e) => e.key === selectedEra)?.label} 的历史` : '当前视野中的历史'}</h3>
          <span>{resultEntities.length} 条</span>
        </div>
        <TimelineResults slim={resultEntities} />
      </div>
    </main>
  )
}
