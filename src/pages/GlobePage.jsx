import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setPageMeta } from '../meta.js'
import { useData } from '../data/useData.js'
import { ROUTES } from '../data/routes.js'
import { CATEGORIES } from '../data/taxonomy.js'
import HistoryGlobe from '../components/HistoryGlobe.jsx'
import '../styles/globe.css'

const TABS = [{ key: '', label: '全部档案' }].concat(ROUTES.map((r) => ({ key: r.key, label: r.name })))

export default function GlobePage() {
  const [tab, setTab] = useState('')
  const navigate = useNavigate()
  const mod = useData()
  const entries = mod ? mod.ALL : []
  const byId = mod ? mod.byId : {}
  useEffect(() => { setPageMeta('3D 地球仪', '五百个坐标悬于蓝星：拖动旋转，点击进入历史。') }, [])
  const theme = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  const route = ROUTES.find((r) => r.key === tab) || null
  const routeEntries = route ? route.entryIds.map((id) => byId[id]).filter(Boolean) : []

  return (
    <main className='globe-page'>
      <div className='globe-head'>
        <p className='eyebrow'>3D 地球仪</p>
        <h1>悬于蓝星的五百年</h1>
        <p>拖动旋转地球，滚轮缩放；光点即档案，点击进入历史。选一条航线，看金弧绕球而行。</p>
      </div>
      <div className='map-tabs'>
        {TABS.map((t) => (
          <button key={t.key || 'all'} className={'map-tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      <HistoryGlobe entries={entries} route={route} theme={theme} onNavigate={navigate} />
      {!route && (
        <div className='map-legend'>
          {CATEGORIES.map((c) => (
            <span key={c.key}><i style={{ background: c.accent }} /> {c.icon} {c.label}</span>
          ))}
          <span className='globe-tip-hint'>鼠标悬停光点可预览名称</span>
        </div>
      )}
      {route && (
        <div className='route-entries'>
          <h3>沿线档案（按行进顺序）</h3>
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