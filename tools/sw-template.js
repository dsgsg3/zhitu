/* 观史 Service Worker —— 由 tools/gen-sw.mjs 注入 BUILD_ID 与 PRECACHE 后写入 dist/sw.js */
const BUILD = '__BUILD_ID__'
const CACHE = 'guanshi-' + BUILD
const IMG_CACHE = 'guanshi-images'
const PRECACHE = __PRECACHE__
const IMG_LIMIT = 400

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('guanshi-') && k !== CACHE && k !== IMG_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // 页面导航：网络优先，离线回退到缓存的预渲染页或 SPA 壳
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy))
          return res
        })
        .catch(() => caches.match(req)
          .then((hit) => hit || caches.match('/index.html'))
          .then((hit) => hit || caches.match('/')))
    )
    return
  }

  // 详情正文：先缓存后更新（SWR），访问过的条目离线可读
  if (url.pathname.startsWith('/data/entity/')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req)
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone())
            return res
          })
          .catch(() => cached)
        return cached || network
      })
    )
    return
  }

  // 实体图片：缓存优先，超出上限淘汰最早条目
  if (url.pathname.startsWith('/images/')) {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const cached = await cache.match(req)
        if (cached) return cached
        const res = await fetch(req)
        if (res && res.ok) {
          cache.put(req, res.clone())
          const keys = await cache.keys()
          if (keys.length > IMG_LIMIT) cache.delete(keys[0])
        }
        return res
      })
    )
    return
  }

  // 其余同源资源（hash 资产 / 本地字体等）：缓存优先
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req).then((res) => {
        if (res && res.ok) caches.open(CACHE).then((cache) => cache.put(req, res.clone()))
        return res
      })
    })
  )
})
