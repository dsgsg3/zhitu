import { Link, useNavigate } from 'react-router-dom'
import { collections } from '../data/collections.js'
import { useFootprint, readCount, favIds, isRead } from '../store.js'
import { CATEGORIES, REGIONS, formatYear } from '../data/taxonomy.js'
import { EntityCard } from '../components/EntityCard.jsx'
import { SkylineSilhouette } from '../components/SkylineSilhouette.jsx'
import { setPageMeta } from '../meta.js'
import { useMemo, useEffect } from 'react'
import { SLIM, TOTAL } from '../data/slim-index.js'
import { useData } from '../data/useData.js'

// 精选：首张 2×2 大卡 + 8 张常规卡，4 列 / 2 列网格均无空洞
const FEATURED = ['tang', 'confucius', 'terracotta-army', 'silk-road', 'rosetta-stone', 'cleopatra', 'mongol-empire', 'marie-curie', 'roman-empire']

// 年轮上的刻点：只留 6 个，沿圆周均匀散开，避免标签互相挤压
const RING_ENTITIES = [
  { id: 'mesopotamia', label: '美索不达米亚', year: -3500, angle: -90 },
  { id: 'confucius', label: '孔子', year: -551, angle: -40 },
  { id: 'tang', label: '唐', year: 618, angle: 10 },
  { id: 'mongol-empire', label: '蒙古帝国', year: 1206, angle: 60 },
  { id: 'columbus-voyage', label: '大航海', year: 1492, angle: 110 },
  { id: 'xinhai-revolution', label: '辛亥革命', year: 1911, angle: 160 },
]

// 每日寄语：按一年中的天数轮换
const QUOTES = [
  '历史的意义，不在于记住每一个年份，\n而在于看见那些曾经真实活过的人。',
  '读史使人明智，而漫游使人亲近。\n今天，去遇见一段陌生的过去。',
  '所有的历史都是当代史，\n所有的远方都与你有关。',
  '时间是最长的河流，\n每一滴水都曾是一整个世界。',
  '记住过去，是为了更好地走向未来。\n先从一条档案开始。',
  '文明是一场接力，\n你手里的这一棒，正从五千年前传来。',
  '大事件由小人物组成，\n点开任何一张卡片，里面都有心跳。',
]
function quoteOfToday() {
  const now = new Date()
  const day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5)
  return QUOTES[day % QUOTES.length].split('\n')
}
function HeroRingInner({ onPick }) {
  return (
    <svg viewBox="0 0 480 480" className="hero-ring-svg" aria-label="历史年轮">
      <circle className="ring-track" cx="240" cy="240" r="196" />
      <circle className="ring-core" cx="240" cy="240" r="86" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180
        return <line key={i} className="ring-tick" x1={240 + 196 * Math.cos(a)} y1={240 + 196 * Math.sin(a)} x2={240 + 186 * Math.cos(a)} y2={240 + 186 * Math.sin(a)} />
      })}
      {RING_ENTITIES.map((e) => {
        const a = e.angle * Math.PI / 180
        const x = 240 + 160 * Math.cos(a)
        const y = 240 + 160 * Math.sin(a)
        const lx = 240 + 118 * Math.cos(a)
        const ly = 240 + 118 * Math.sin(a)
        return (
          <g
            key={e.id}
            onClick={() => onPick(e.id)}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={`${e.label}，${formatYear(e.year)}`}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault()
                onPick(e.id)
              }
            }}
          >
            {/* 隐形点击区：视觉圆点仅 6px，触摸目标扩到 32px */}
            <circle cx={x} cy={y} r="16" fill="transparent" />
            <line className="ring-lead" x1={x} y1={y} x2={240 + 134 * Math.cos(a)} y2={240 + 134 * Math.sin(a)} />
            <circle className="ring-dot" cx={x} cy={y} r="6" />
            <text className="ring-dot-label" x={lx} y={ly} textAnchor="middle" dominantBaseline="central">{e.label}</text>
          </g>
        )
      })}
      <text x="240" y="234" textAnchor="middle" className="ring-label">5000</text>
      <text x="240" y="254" textAnchor="middle" style={{ fontSize: 14, fill: 'var(--ink)', fontFamily: 'var(--serif)', letterSpacing: '.12em' }}>五千年</text>
    </svg>
  )
}

function Footprint() {
  const navigate = useNavigate()
  const snap = useFootprint()
  const done = readCount(snap)
  const total = TOTAL
  const pct = Math.round((done / total) * 100)
  const next = [...SLIM].sort((a, b) => a.year - b.year).find((e) => !isRead(e.id, snap))
  const favList = favIds(snap).slice(0, 4)
  return (
    <section className="section-pad" style={{ paddingTop: 12 }}>
      <div className="section-head">
        <div>
          <p className="eyebrow">你的足迹</p>
          <h2>{done === 0 ? '五千年，从第一段开始' : `已探索 ${done} / ${total}`}</h2>
        </div>
        <div className="side">进度只存在这台设备<br />不登录，不上传</div>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="探索进度">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="footprint-meta">
        <b>{pct}%</b>
        <span className="footprint-side">★ 收藏 {Object.keys(snap.fav).length} 段</span>
      </div>
      <div className="hero-actions" style={{ marginTop: 12 }}>
        {next && <button className="button button-solid" onClick={() => navigate(`/entity/${next.id}`)}>继续探索：{next.name} →</button>}
        <Link to="/browse" className="button">去档案库逛逛</Link>
      </div>
      <FavCards ids={favList} />
    </section>
  )
}

// 收藏卡：需要完整档案，数据到达后渲染
function FavCards({ ids }) {
  const mod = useData()
  if (!mod) return null
  const favs = ids.map((id) => mod.byId[id]).filter(Boolean)
  if (!favs.length) return null
  return (
    <div className="entity-grid" style={{ marginTop: 16 }}>
      {favs.map((e) => <EntityCard key={e.id} entity={e} />)}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const picks = useMemo(() => CATEGORIES.map((c) => ({ ...c, count: SLIM.filter((e) => e.category === c.key).length })), [])
  const daily = useMemo(() => quoteOfToday(), [])
  useEffect(() => { setPageMeta() }, [])
  const roam = () => {
    loadData().then(({ ALL }) => {
      const e = ALL[Math.floor(Math.random() * ALL.length)]
      if (e) navigate(`/entity/${e.id}`)
    })
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">观史 · 看见过去</p>
          <h1>把五千年<br /><em>握在手里</em></h1>
          <p className="hero-sub">从两河流域的第一块泥板，到今天你手机里的世界。文明、人物、文物与事件，铺成一张可以漫游的时间地图。</p>
          <div className="hero-actions">
            <Link to="/timeline" className="button button-solid">进入时间轴 →</Link>
            <Link to="/browse" className="button">按分类浏览</Link>
            <button className="button" onClick={roam}>随机漫游 ✦</button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><b>{TOTAL}</b><span>条历史档案</span></div>
            <div className="hero-stat"><b>{CATEGORIES.length}</b><span>个探索维度</span></div>
            <div className="hero-stat"><b>{REGIONS.length}</b><span>大文明区域</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-ring-wrap">
            <SkylineSilhouette />
            <div className="hero-ring"><HeroRingInner onPick={(id) => navigate(`/entity/${id}`)} /></div>
          </div>
        </div>
      </section>

      <section className="picks">
        {picks.map((p) => (
          <Link key={p.key} to={`/browse?cat=${p.key}`} className="pick-card" style={{ '--c': p.accent }}>
            <span className="pick-icon">{p.icon}</span>
            <strong>{p.label}</strong>
            <small>{p.count} 条档案 · 点击进入</small>
            <b>→</b>
          </Link>
        ))}
      </section>

      <Footprint />

      <section className="section-pad" style={{ paddingTop: 12 }}>
        <div className="section-head">
          <div>
            <p className="eyebrow">精选</p>
            <h2>值得首先遇见的历史</h2>
          </div>
          <div className="side">每一条都可以点进去<br />看完整的故事与同期世界</div>
        </div>
        <FeaturedGrid />
      </section>

      <section className="section-pad" style={{ paddingTop: 12 }}>
        <div className="section-head">
          <div>
            <p className="eyebrow">专题策展</p>
            <h2>照着路线读历史</h2>
          </div>
          <div className="side"><Link to="/collections">全部专题 →</Link></div>
        </div>
        <div className="picks">
          {collections.slice(0, 4).map((c) => (
            <Link key={c.id} to={`/collection/${c.id}`} className="pick-card" style={{ '--c': 'var(--gold)' }}>
              <span className="pick-icon">✦</span>
              <strong>{c.name}</strong>
              <small>{c.kicker} · {c.entries.length} 段</small>
              <b>→</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="daily">
        <div className="daily-inner">
          <div className="daily-quote">
            <span className="quote-mark">“</span>
            <p>{daily.map((line, i) => <span key={i}>{line}{i < daily.length - 1 && <br />}</span>)}</p>
            <span className="src">— 观史 · 今日寄语</span>
          </div>
        </div>
      </section>
    </main>
  )
}

// 精选卡：需要完整档案，数据到达后渲染
function FeaturedGrid() {
  const mod = useData()
  if (!mod) return <div className="route-loading">精选载入中…</div>
  const featured = FEATURED.map((id) => mod.ALL.find((e) => e.id === id)).filter(Boolean)
  return (
    <div className="entity-grid">
      {featured.map((e, i) => <EntityCard key={e.id} entity={e} featured={i === 0} />)}
    </div>
  )
}
