import { CATEGORIES, formatYear } from '../data/taxonomy.js'
import { Link } from 'react-router-dom'
import { useFootprint, isRead } from '../store.js'

export function CategoryTag({ category }) {
  const c = CATEGORIES.find((x) => x.key === category)
  return <span className="cat-tag" style={{ '--cat': c.accent }}>{c.icon} {c.label}</span>
}

export function EntityCard({ entity, featured = false }) {
  const c = CATEGORIES.find((x) => x.key === entity.category)
  const snap = useFootprint()
  const read = isRead(entity.id, snap)
  return (
    <Link to={`/entity/${entity.id}`} className={`entity-card ${featured ? 'featured' : ''}`} data-cat={entity.category} style={{ '--cat': c.accent }}>
      <div className="entity-card-top">
        <CategoryTag category={entity.category} />
        <span className="entity-year">{entity.range ? `${formatYear(entity.range[0])} — ${formatYear(entity.range[1] ?? entity.range[0])}` : formatYear(entity.year)}{read ? ' · 已读' : ''}</span>
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
