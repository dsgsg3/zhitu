import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import { CATEGORIES, REGIONS } from '../data/taxonomy.js'

const W = 960
const H = 520

const REGION_CENTER = {
  china: [34, 104],
  'east-asia': [20, 112],
  'middle-east': [30, 45],
  'south-asia': [21, 78],
  europe: [50, 15],
  africa: [5, 22],
  americas: [15, -95],
  oceania: [-25, 140],
}

function jitter(id, sx, sy) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const a = ((h % 200) / 100 - 1) * sx
  const b = (((h >> 4) % 200) / 100 - 1) * sy
  return [a, b]
}

export default function HistoryMap({ entries = [], route = null }) {
  const nav = useNavigate()
  const land = useMemo(() => feature(world, world.objects.countries), [])
  const projection = useMemo(() => geoNaturalEarth1().fitSize([W, H], { type: 'Sphere' }), [])
  const pathGen = useMemo(() => geoPath(projection), [projection])
  const landPath = useMemo(() => pathGen(land), [land, pathGen])

  const catAccent = {}
  const regionLabel = Object.fromEntries(REGIONS.map((r) => [r.key, r.label]))
  for (const c of CATEGORIES) catAccent[c.key] = c.accent

  // 航线动画
  const pathRef = useRef(null)
  const [len, setLen] = useState(0)
  const [go, setGo] = useState(false)
  useEffect(() => {
    if (!route) return undefined
    const t = setTimeout(() => {
      if (pathRef.current) setLen(pathRef.current.getTotalLength())
      requestAnimationFrame(() => setGo(true))
    }, 60)
    return () => clearTimeout(t)
  }, [route])

  const regionKeys = Object.keys(REGION_CENTER)

  return (
    <div className='map-frame'>
      <svg viewBox={'0 0 ' + W + ' ' + H} role='img' aria-label='世界历史地图'>
        <rect x='0' y='0' width={W} height={H} fill='var(--paper, #fdfbf6)' />
        <path className='map-land' d={landPath} />

        {route && (
          <path
            ref={pathRef}
            className='route-path'
            d={pathGen({ type: 'LineString', coordinates: route.path.map((p) => [p[0], p[1]]) })}
            stroke={route.color}
            fill='none'
            style={go && len
              ? { strokeDasharray: len, strokeDashoffset: 0, transition: 'stroke-dashoffset ' + route.duration + 'ms ease-in-out' }
              : { strokeDasharray: len || 1, strokeDashoffset: len || 1 }}
          />
        )}

        {route && route.path.map((p, i) => {
          const pt = projection([p[0], p[1]])
          if (!pt) return null
          const delay = Math.round((i / Math.max(1, route.path.length - 1)) * route.duration)
          return (
            <g key={route.key + '-wp-' + i} style={{ opacity: go ? 1 : 0, transition: 'opacity 400ms ease ' + delay + 'ms' }}>
              <circle className='route-wp' cx={pt[0]} cy={pt[1]} r='4.5' stroke={route.color} />
              <text className='route-wp-label' x={pt[0]} y={pt[1] - 10}>{p[2]}</text>
            </g>
          )
        })}

        {!route && entries.map((e) => {
          if (!e.region || !REGION_CENTER[e.region]) return null
          const c = REGION_CENTER[e.region]
          const d = jitter(e.id, 17, 11)
          const pt = projection([c[0] + d[0], c[1] + d[1]])
          if (!pt) return null
          return (
            <circle
              key={e.id}
              className='map-dot'
              cx={pt[0]}
              cy={pt[1]}
              r='3.4'
              fill={catAccent[e.category] || '#888'}
              onClick={() => nav('/entity/' + e.id)}
            >
              <title>{e.name} · {e.kicker}（点击进入）</title>
            </circle>
          )
        })}

        {!route && regionKeys.map((k) => {
          const pt = projection(REGION_CENTER[k])
          if (!pt) return null
          return (
            <g key={'rg-' + k}>
              <circle
                className='map-region-hit'
                cx={pt[0]}
                cy={pt[1]}
                r='30'
                onClick={() => nav('/browse?region=' + k)}
              >
                <title>按地域浏览：{k}</title>
              </circle>
              <text className='map-region-label' x={pt[0]} y={pt[1] + 4}>{regionLabel[k] || k}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}