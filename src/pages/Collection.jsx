import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { setPageMeta } from '../meta.js'
import { useFootprint, isRead } from '../store.js'
import { collectionById } from '../data/collections.js'
import { useData } from '../data/useData.js'
import { EntityCard } from '../components/EntityCard.jsx'
import NotFound from './NotFound.jsx'

export default function Collection() {
  const { id } = useParams()
  const collection = collectionById[id]
  const snap = useFootprint()
  const mod = useData()

  useEffect(() => {
    if (collection) setPageMeta(`专题 · ${collection.name}`, collection.summary)
  }, [collection])

  if (!collection) return <NotFound />
  if (!mod) return <div className="route-loading">档案载入中…</div>

  const items = collection.entries.map((en) => ({ ...en, entity: mod.byId[en.id] })).filter((x) => x.entity)
  const done = items.filter((it) => isRead(it.id, snap)).length

  return (
    <main className="browse-page">
      <div className="browse-head">
        <p className="eyebrow">专题 · {collection.kicker}</p>
        <h1>{collection.name}</h1>
        <p>{collection.summary}</p>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length} aria-label="专题阅读进度">
        <div className="progress-fill" style={{ width: `${items.length ? Math.round((done / items.length) * 100) : 0}%` }} />
      </div>
      <p className="browse-count">本专题已读 {done} / {items.length} 段</p>
      <div className="entity-grid">
        {items.map((it, i) => (
          <div key={it.id} className="collection-item">
            <span className="collection-num">{isRead(it.id, snap) ? '✓' : String(i + 1).padStart(2, '0')}</span>
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
