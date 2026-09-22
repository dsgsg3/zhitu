import { useMemo, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NotFound from './NotFound.jsx'
import { setPageMeta } from '../meta.js'
import { useFootprint, markRead, toggleFav, isFav } from '../store.js'
import { byId, ALL } from '../data/index.js'
import { CATEGORIES, REGIONS, ERAS, eraOf, eraLabel, formatYear } from '../data/taxonomy.js'
import { EntityCard } from '../components/EntityCard.jsx'

export default function Detail() {
  const { id } = useParams()
  const entity = byId[id]

  // 实体的时间锚点：有区间取中点，否则取年份
  const mid = (e) => (e.range ? (e.range[0] + (e.range[1] ?? e.range[0])) / 2 : e.year)
  const anchorYear = entity ? Math.round(mid(entity)) : 0

  // 同期世界：锚点年份前后 120 年内的其他实体（排除自身）
  // 必须写在下面的 early return 之前，否则 Hook 数量随路由变化，React 会报错
  const sameEra = useMemo(() => {
    if (!entity) return []
    return ALL
      .filter((e) => e.id !== entity.id && Math.abs(mid(e) - anchorYear) <= 120)
      .sort((a, b) => Math.abs(mid(a) - anchorYear) - Math.abs(mid(b) - anchorYear))
      .slice(0, 6)
  }, [entity, anchorYear])

  // 时间上的上一篇 / 下一篇（按锚点年份排序）
  // 同样必须写在 early return 之前，保证 Hook 顺序稳定
  const neighbors = useMemo(() => {
    if (!entity) return { prev: null, next: null }
    const sorted = [...ALL].sort((a, b) => a.year - b.year)
    const i = sorted.findIndex((e) => e.id === entity.id)
    return { prev: sorted[i - 1] || null, next: sorted[i + 1] || null }
  }, [entity])

  useEffect(() => {
    if (entity) setPageMeta(entity.name, entity.summary)
  }, [entity])

  // 打开即记为已读（写 localStorage，手下留情：只记一次）
  const snap = useFootprint()
  useEffect(() => {
    if (entity) markRead(entity.id)
  }, [entity])
  const fav = entity ? isFav(entity.id, snap) : false

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
  }, [entity])

  if (!entity) return <NotFound />

  const cat = CATEGORIES.find((c) => c.key === entity.category)
  const region = REGIONS.find((r) => r.key === entity.region)
  const eraKey = eraOf(entity.year)

  const related = (entity.related || []).map((rid) => byId[rid]).filter(Boolean)

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
            <figure className="detail-figure">
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
          {entity.paragraphs.map((p, i) => <p key={i} className="para">{p}</p>)}
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
