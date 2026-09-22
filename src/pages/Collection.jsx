import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { setPageMeta } from '../meta.js'
import { collectionById } from '../data/collections.js'
import { byId } from '../data/index.js'
import { EntityCard } from '../components/EntityCard.jsx'
import NotFound from './NotFound.jsx'

export default function Collection() {
  const { id } = useParams()
  const collection = collectionById[id]

  useEffect(() => {
    if (collection) setPageMeta(`专题 · ${collection.name}`, collection.summary)
  }, [collection])

  if (!collection) return <NotFound />

  const items = collection.entries.map((en) => ({ ...en, entity: byId[en.id] })).filter((x) => x.entity)

  return (
    <main className="browse-page">
      <div className="browse-head">
        <p className="eyebrow">专题 · {collection.kicker}</p>
        <h1>{collection.name}</h1>
        <p>{collection.summary}</p>
      </div>
      <div className="entity-grid">
        {items.map((it, i) => (
          <div key={it.id} className="collection-item">
            <span className="collection-num">{String(i + 1).padStart(2, '0')}</span>
            <EntityCard entity={it.entity} />
            <p className="collection-note">{it.note}</p>
          </div>
        ))}
      </div>
      <div className="hero-actions" style={{ marginTop: 24 }}>
        <Link to="/collections" className="button">← 全部专题</Link>
        <Link to="/timeline" className="button">去时间轴看看 →</Link>
      </div>
    </main>
  )
}
