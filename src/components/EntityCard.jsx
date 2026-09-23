import { CATEGORIES, formatYear } from '../data/taxonomy.js'
import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { useFootprint, isRead, isFav } from '../store.js'

export function CategoryTag({ category }) {
  const c = CATEGORIES.find((x) => x.key === category)
  return <span className="cat-tag" style={{ '--cat': c.accent }}>{c.icon} {c.label}</span>
}

export function EntityCard({ entity, featured = false }) {
  const c = CATEGORIES.find((x) => x.key === entity.category)
  const snap = useFootprint()
  const read = isRead(entity.id, snap)
  const fav = isFav(entity.id, snap)
  // 3D 倾斜：直接写 CSS 变量，不经过 setState，保证 mousemove 不重渲染
  const ref = useRef(null)
  const reduceMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const onTilt = (e) => {
    const el = ref.current
    if (!el || reduceMotion()) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', `${(-py * 5).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(px * 7).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`)
  }
  const resetTilt = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }
  return (
    <Link ref={ref} to={`/entity/${entity.id}`} onMouseMove={onTilt} onMouseLeave={resetTilt} className={`entity-card ${featured ? 'featured' : ''}`} data-cat={entity.category} style={{ '--cat': c.accent }}>
      <div className="entity-card-top">
        <CategoryTag category={entity.category} />
        <span className="entity-year">{entity.range ? `${formatYear(entity.range[0])} — ${formatYear(entity.range[1] ?? entity.range[0])}` : formatYear(entity.year)}{read ? ' · 已读' : ''}{fav ? ' · ★ 收藏' : ''}</span>
      </div>
      {entity.image && (
        <span className="entity-thumb">
          <img
            src={entity.image.src}
            alt={entity.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.closest('.entity-thumb')?.remove() }}
          />
        </span>
      )}
      <h3>{entity.name}</h3>
      {entity.foreign && <p className="entity-foreign">{entity.foreign}</p>}
      <p className="entity-summary">{entity.summary}</p>
      <span className="entity-more">走进 {entity.kicker} <b>→</b></span>
    </Link>
  )
}
