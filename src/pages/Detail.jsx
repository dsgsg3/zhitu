import { useMemo, useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import NotFound from './NotFound.jsx'
import { setPageMeta } from '../meta.js'
import { useFootprint, markRead, toggleFav, isFav } from '../store.js'
import { slimIndex, loadData } from '../data/useData.js'
import { CATEGORIES, REGIONS, ERAS, eraOf, eraLabel, formatYear } from '../data/taxonomy.js'
import { EntityCard } from '../components/EntityCard.jsx'

export default function Detail() {
  const { id } = useParams()
  // 基础信息走同步精简索引（首屏立即渲染）；正文等全量字段随后异步拉取
  // 注意：Hook 必须全部在 early return 之前，保持顺序稳定
  const slim = slimIndex.byId[id]
  const [full, setFull] = useState(null)
  useEffect(() => {
    if (!slim || full) return undefined
    let on = true
    loadData().then((m) => { if (on) setFull(m) })
    return () => { on = false }
  }, [slim, full])

  // 实体的时间锚点：有区间取中点，否则取年份
  const mid = (e) => (e.range ? (e.range[0] + (e.range[1] ?? e.range[0])) / 2 : e.year)
  const anchorYear = slim ? Math.round(mid(slim)) : 0

  // 同期世界：锚点年份前后 120 年内的其他实体（排除自身）；纯 slim 字段即可
  const sameEra = useMemo(() => {
    if (!slim) return []
    return slimIndex.SLIM
      .filter((e) => e.id !== slim.id && Math.abs(mid(e) - anchorYear) <= 120)
      .sort((a, b) => Math.abs(mid(a) - anchorYear) - Math.abs(mid(b) - anchorYear))
      .slice(0, 6)
  }, [slim, anchorYear])

  // 时间上的上一篇 / 下一篇（按锚点年份排序）
  const neighbors = useMemo(() => {
    if (!slim) return { prev: null, next: null }
    const sorted = [...slimIndex.SLIM].sort((a, b) => a.year - b.year)
    const i = sorted.findIndex((e) => e.id === slim.id)
    return { prev: sorted[i - 1] || null, next: sorted[i + 1] || null }
  }, [slim])

  useEffect(() => {
    if (slim) setPageMeta(slim.name, slim.summary)
  }, [slim])

  // 打开即记为已读（写 localStorage，手下留情：只记一次）
  const snap = useFootprint()
  useEffect(() => {
    if (slim) markRead(slim.id)
  }, [slim])
  const fav = slim ? isFav(slim.id, snap) : false

  // 阅读进度：顶部细线
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setProgress(max > 0 ? Math.min(1, h.scrollTop / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [slim])

  // 头图滚动视差：图随滚动微移（±28px），直接写 DOM 不重渲染
  const figRef = useRef(null)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = figRef.current
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const r = el.getBoundingClientRect()
        const center = r.top + r.height / 2 - window.innerHeight / 2
        const dy = Math.max(-28, Math.min(28, -center * 0.08))
        el.style.setProperty('--py', `${dy.toFixed(1)}px`)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [slim])

  if (!slim) return <NotFound />

  // 正文等全量字段：full 到达前以 slim 基础字段渲染，正文区域为空不影响骨架
  const entity = full ? full.byId[slim.id] || slim : slim

  const cat = CATEGORIES.find((c) => c.key === slim.category)
  const region = REGIONS.find((r) => r.key === slim.region)
  const eraKey = eraOf(slim.year)

  const related = (slim.related || []).map((rid) => slimIndex.byId[rid]).filter(Boolean)

  // 出处：有则展示，无则给一条维基检索兜底（检索页恒成立，不会 404）
  const sources = entity.sources && entity.sources.length > 0
    ? entity.sources
    : [{ label: '维基百科检索', url: `https://zh.wikipedia.org/w/index.php?search=${encodeURIComponent(entity.name)}` }]

  return (
    <main className="detail-page" style={{ '--cat': cat.accent }}>
      <div className="read-progress" aria-hidden="true" style={{ transform: `scaleX(${progress})` }} />
      <section className="detail-hero">
        <div className="detail-hero-inner">
          <div className="detail-crumb">
            <Link to="/">首页</Link> / <Link to={`/browse?cat=${entity.category}`}>{cat.label}</Link> / {entity.name}
          </div>
          <div className="detail-kicker">
            <span className="cat-tag" style={{ '--cat': cat.accent }}>{cat.icon} {cat.label}</span>
            {region && <span className="cat-tag" style={{ '--cat': 'var(--ink-soft)' }}>{region.label}</span>}
            {eraKey && <span className="cat-tag" style={{ '--cat': 'var(--ink-soft)' }}>{eraLabel(eraKey)?.short}</span>}
          </div>
          <h1>{entity.name}</h1>
          {entity.foreign && <p className="detail-foreign">{entity.foreign}</p>}
          <p className="detail-summary">{entity.summary}</p>
          <div className="detail-range">
            <span className="bar" />
            {entity.range
              ? `${formatYear(entity.range[0])} — ${formatYear(entity.range[1] ?? entity.range[0])}`
              : formatYear(entity.year)}
            <span style={{ color: 'var(--ink-faint)' }}>· {entity.kicker}</span>
          </div>
          <div className="detail-actions">
            <button className={`button${fav ? ' button-solid' : ''}`} onClick={() => toggleFav(entity.id)}>
              {fav ? '★ 已收藏' : '☆ 收藏这一段'}
            </button>
          </div>
          {entity.image && (
            <figure className="detail-figure" ref={figRef}>
              <img
                src={entity.image.src}
                alt={entity.name}
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.closest('.detail-figure')?.remove() }}
              />
              <figcaption>
                图：{entity.image.author} · {entity.image.license}
                {' · '}
                <a href={entity.image.page} target="_blank" rel="noreferrer">Wikimedia Commons ↗</a>
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      <div className="detail-body">
        <article className="detail-article">
          {entity.paragraphs?.map((p, i) => <p key={i} className="para">{p}</p>)}
          {entity.sections?.map((sec, si) => (
            <section key={si} className="detail-section">
              <h2 className="detail-sec-h">{sec.heading}</h2>
              {sec.paragraphs.map((pj, j) => <p key={j} className="para">{pj}</p>)}
            </section>
          ))}
          {entity.quote && (
            <blockquote className="detail-quote">
              <p>“{entity.quote}”</p>
              <cite>— {entity.quoteBy}</cite>
            </blockquote>
          )}
        </article>

        <aside className="detail-side">
          {entity.facts && (
            <div className="facts-card">
              <h4>关键事实</h4>
              {entity.facts.map((f, i) => (
                <div className="fact-row" key={i}>
                  <span>{f.label}</span>
                  <b>{f.value}</b>
                </div>
              ))}
            </div>
          )}
          {related.length > 0 && (
            <div className="related-card">
              <h4>关联历史</h4>
              {related.map((r) => {
                const rc = CATEGORIES.find((c) => c.key === r.category)
                return (
                  <Link key={r.id} to={`/entity/${r.id}`} className="related-item">
                    <span className="r-name">{r.name}</span>
                    <span className="r-meta">{rc.short} · {formatYear(r.range ? r.range[0] : r.year)}</span>
                  </Link>
                )
              })}
            </div>
          )}
          <div className="related-card">
            <h4>参考与延伸</h4>
            {sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer" className="related-item">
                <span className="r-name">{s.label}</span>
                <span className="r-meta">↗</span>
              </a>
            ))}
          </div>
        </aside>
      </div>

      {sameEra.length > 0 && (
        <section className="sameera-section">
          <h3>同期世界</h3>
          <p className="sameera-sub">约 {formatYear(anchorYear)} 前后，这些也在发生 —</p>
          <div className="sameera-grid">
            {sameEra.map((e) => <EntityCard key={e.id} entity={e} />)}
          </div>
        </section>
      )}

      <nav className="detail-nav" aria-label="按时间浏览">
        {neighbors.prev ? (
          <Link to={`/entity/${neighbors.prev.id}`} className="detail-nav-item">
            <small>← 更早 · {formatYear(neighbors.prev.range ? neighbors.prev.range[0] : neighbors.prev.year)}</small>
            <strong>{neighbors.prev.name}</strong>
          </Link>
        ) : <span />}
        {neighbors.next ? (
          <Link to={`/entity/${neighbors.next.id}`} className="detail-nav-item next">
            <small>{formatYear(neighbors.next.range ? neighbors.next.range[0] : neighbors.next.year)} · 更晚 →</small>
            <strong>{neighbors.next.name}</strong>
          </Link>
        ) : <span />}
      </nav>
    </main>
  )
}
