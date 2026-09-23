import { useState } from 'react'
import { Link } from 'react-router-dom'
import { setPageMeta } from '../meta.js'
import { useEffect } from 'react'
import { useData } from '../data/useData.js'
import { ROUTES } from '../data/routes.js'
import { CATEGORIES } from '../data/taxonomy.js'
import { EntityCard } from '../components/EntityCard.jsx'
import HistoryMap from '../components/HistoryMap.jsx'
import '../styles/map.css'

const TABS = [{ key: '', label: '全部档案' }].concat(ROUTES.map((r) => ({ key: r.key, label: r.name })))

export default function MapPage() {
  const [tab, setTab] = useState('')
  const mod = useData()
  const entries = mod ? mod.ALL : []
  const byId = mod ? mod.byId : {}
  useEffect(() => { setPageMeta('历史地图', '五百年，五百个坐标：按地域漫游，或沿航线出发。') }, [])
  const route = ROUTES.find((r) => r.key === tab) || null
  const routeEntries = route ? route.entryIds.map((id) => byId[id]).filter(Boolean) : []

  return (
    <main className='map-page'>
      <div className='map-head'>
        <p className='eyebrow'>历史地图</p>
        <h1>五百个坐标</h1>
        <p>历史本来就发生在空间里：点亮全部档案，或沿四条航线出发。</p>
      </div>

      <div className='map-tabs'>
        {TABS.map((t) => (
          <button key={t.key || 'all'} className={'map-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <HistoryMap entries={entries} route={route} />

      {!route && (
        <div>
          <div className='map-legend'>
            {CATEGORIES.map((c) => (
              <span key={c.key}><i style={{ background: c.accent }} /> {c.icon} {c.label}</span>
            ))}
          </div>
          <p className='map-hint'>圆点 = 一条档案（颜色为类别）；悬停查看名称，点击进入。点区域名称可按地域筛选档案。</p>
        </div>
      )}

      {route && (
        <div className='route-entries'>
          <h3>沿线的档案（按行进顺序）</h3>
          <div className='route-entry-list'>
            {routeEntries.map((e, i) => (
              <Link key={e.id} to={'/entity/' + e.id} className='route-entry'>
                <span className='no'>{String(i + 1).padStart(2, '0')}</span>
                <b>{e.name}</b>
                <span>{e.kicker}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}