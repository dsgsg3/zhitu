import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { setPageMeta } from '../meta.js'
import { collections } from '../data/collections.js'
import { byId } from '../data/index.js'

export default function Collections() {
  useEffect(() => { setPageMeta('专题', '编辑精选的阅读路线。') }, [])
  return (
    <main className="browse-page">
      <div className="browse-head">
        <p className="eyebrow">专题策展</p>
        <h1>照着路线读历史</h1>
        <p>看完一条不知道去哪？跟着编辑选好的路线走，每条路线都是一段完整的故事。</p>
      </div>
      <div className="picks">
        {collections.map((c) => {
          const names = c.entries.map((en) => byId[en.id]?.name).filter(Boolean).slice(0, 4).join(' · ')
          return (
            <Link key={c.id} to={`/collection/${c.id}`} className="pick-card" style={{ '--c': 'var(--gold)' }}>
              <span className="pick-icon">✦</span>
              <strong>{c.name}</strong>
              <small>{c.kicker} · {c.entries.length} 段</small>
              <small style={{ opacity: 0.75 }}>{names}…</small>
              <b>→</b>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
