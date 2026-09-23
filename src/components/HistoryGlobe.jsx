import { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { geoEquirectangular, geoPath, geoGraticule } from 'd3-geo'
import { feature } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import { CATEGORIES } from '../data/taxonomy.js'

const R = 100
const W = 2048
const H = 1024

const REGION_LL = {
  china: [104, 35],
  'east-asia': [112, 20],
  'middle-east': [45, 30],
  'south-asia': [78, 21],
  europe: [15, 50],
  africa: [22, 5],
  americas: [-95, 15],
  oceania: [140, -25],
}

function jitter(id, sx, sy) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const a = ((h % 200) / 100 - 1) * sx
  const b = (((h >> 4) % 200) / 100 - 1) * sy
  return [a, b]
}

function llToVec(lng, lat, r) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

function drawWorldTexture(theme) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const dark = theme === 'dark'
  ctx.fillStyle = dark ? '#1d1d24' : '#e9f0f5'
  ctx.fillRect(0, 0, W, H)
  const projection = geoEquirectangular().translate([W / 2, H / 2]).scale(W / (2 * Math.PI))
  const path = geoPath(projection, ctx)
  const land = feature(world, world.objects.countries)
  ctx.beginPath()
  path(land)
  ctx.fillStyle = dark ? '#343442' : '#dcd5c2'
  ctx.fill()
  ctx.strokeStyle = dark ? '#4a4a58' : '#c9c2ae'
  ctx.lineWidth = 0.5
  ctx.stroke()
  const grat = geoGraticule()
  ctx.beginPath()
  path(grat)
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  ctx.lineWidth = 0.4
  ctx.stroke()
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function slerpArc(a, b, segments, lift) {
  const pts = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const v = a.clone().lerp(b, t).normalize().multiplyScalar(R + 1 + Math.sin(t * Math.PI) * lift)
    pts.push(v)
  }
  return pts
}

export default function HistoryGlobe({ entries = [], route = null, theme = 'light', onNavigate = () => {} }) {
  const mountRef = useRef(null)
  const navRef = useRef(null)
  const [hover, setHover] = useState(null)
  const sceneKey = theme + '|' + (route ? route.key : 'all') + '|' + entries.length

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const dark = theme === 'dark'
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / 520, 0.1, 3000)
    camera.position.set(0, 40, 300)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mount.clientWidth, 520)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const tex = drawWorldTexture(theme)
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 64),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }),
    )
    scene.add(globe)

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.015, 48, 48),
      new THREE.MeshBasicMaterial({ color: dark ? 0x4a6fa5 : 0x9db8d9, transparent: true, opacity: 0.14, side: THREE.BackSide }),
    )
    scene.add(halo)

    const starGeo = new THREE.BufferGeometry()
    const starPos = []
    for (let i = 0; i < 700; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(600 + Math.random() * 400)
      starPos.push(v.x, v.y, v.z)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3))
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: dark ? 0x8888aa : 0xaaa5c8, size: 1.4, sizeAttenuation: true }))
    scene.add(stars)

    scene.add(new THREE.AmbientLight(0xffffff, dark ? 1.6 : 1.15))
    const sun = new THREE.DirectionalLight(0xffffff, dark ? 0.7 : 1.1)
    sun.position.set(2, 0.8, 1.5)
    scene.add(sun)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.enablePan = false
    controls.minDistance = 140
    controls.maxDistance = 520
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.45
    renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false })

    const catAccent = {}
    for (const c of CATEGORIES) catAccent[c.key] = c.accent
    const markerPos = []
    const markerCol = []
    const markerMeta = []
    for (const e of entries) {
      const ll = REGIONS.find((r) => r.key === e.region)
      const center = REGION_LL[e.region] || [0, 0]
      const j = jitter(e.id, 16, 10)
      const lng = center[0] + j[0]
      const lat = Math.max(-60, Math.min(65, center[1] + j[1]))
      const v = llToVec(lng, lat, R + 0.6)
      markerPos.push(v.x, v.y, v.z)
      const col = new THREE.Color(catAccent[e.category] || '#888')
      markerCol.push(col.r, col.g, col.b)
      markerMeta.push({ id: e.id, name: e.name, kicker: e.kicker, v })
    }
    const mgeo = new THREE.BufferGeometry()
    mgeo.setAttribute('position', new THREE.Float32BufferAttribute(markerPos, 3))
    mgeo.setAttribute('color', new THREE.Float32BufferAttribute(markerCol, 3))
    const markerPoints = new THREE.Points(
      mgeo,
      new THREE.PointsMaterial({ size: 3.4, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.95 }),
    )
    scene.add(markerPoints)

    let routeGroup = null
    let routeAnim = null
    if (route) {
      routeGroup = new THREE.Group()
      const wpVecs = route.path.map((p) => llToVec(p[0], p[1], R + 0.6))
      let totalPts = []
      const segCounts = []
      for (let s = 0; s < wpVecs.length - 1; s++) {
        const arc = slerpArc(wpVecs[s], wpVecs[s + 1], 40, 9)
        segCounts.push(arc.length)
        totalPts = totalPts.concat(arc)
      }
      const rgeo = new THREE.BufferGeometry().setFromPoints(totalPts)
      const rline = new THREE.Line(
        rgeo,
        new THREE.LineBasicMaterial({ color: new THREE.Color(route.color), transparent: true, opacity: 0.95 }),
      )
      routeGroup.add(rline)
      routeAnim = { line: rline, total: totalPts.length }
      wpVecs.forEach((v, i) => {
        const wp = new THREE.Mesh(
          new THREE.SphereGeometry(1.1, 12, 12),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(route.color) }),
        )
        wp.position.copy(v)
        routeGroup.add(wp)
      })
      scene.add(routeGroup)
    }

    const raycaster = new THREE.Raycaster()
    raycaster.params.Points = { threshold: 2.6 }
    const pointer = new THREE.Vector2()
    const setPointer = (ev) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
    }
    const onMove = (ev) => {
      setPointer(ev)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObject(markerPoints)
      if (hits.length) {
        const meta = markerMeta[hits[0].index]
        setHover({ name: meta.name, kicker: meta.kicker, x: ev.clientX - mount.getBoundingClientRect().left, y: ev.clientY - mount.getBoundingClientRect().top })
        renderer.domElement.style.cursor = 'pointer'
      } else {
        setHover(null)
        renderer.domElement.style.cursor = 'grab'
      }
    }
    const onClick = (ev) => {
      setPointer(ev)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObject(markerPoints)
      if (hits.length) navRef.current('/entity/' + markerMeta[hits[0].index].id)
    }
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('click', onClick)

    let raf = 0
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = clock.getDelta()
      stars.rotation.y += dt * 0.01
      if (routeAnim && routeAnim.total > 0) {
        const target = Math.min(1, (routeAnim.line.geometry.drawRange.count || 0) / routeAnim.total + 0.008)
        routeAnim.line.geometry.setDrawRange(0, Math.floor(target * routeAnim.total))
      }
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const ro = new ResizeObserver(() => {
      if (!mount.clientWidth) return
      camera.aspect = mount.clientWidth / 520
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, 520)
    })
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('click', onClick)
      controls.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [sceneKey])

  const navSync = useRef(0)
  navSync.current = onNavigate
  void navSync

  return (
    <div className='globe-wrap' ref={mountRef}>
      {hover && (
        <div className='globe-tip' style={{ left: hover.x + 14, top: hover.y - 10 }}>
          <b>{hover.name}</b>
          <span>{hover.kicker}</span>
        </div>
      )}
    </div>
  )
}