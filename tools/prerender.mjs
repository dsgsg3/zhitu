// 构建期预渲染（npm run build 的最后一步，依赖 dist/ 与 dist-ssr/）：
// - dist/entity/<id>.html、dist/collection/<id>.html、dist/collections.html：
//   服务端渲染好的完整页面（标题/描述/OG/canonical/JSON-LD + 正文），浏览器端 hydrate 接管
// - dist/data/entity/<id>.json：单篇正文，站内跳转时详情页只拉这一篇
// - dist/sitemap.xml、dist/robots.txt
// 站点地址可用 SITE_URL 环境变量覆盖。
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SITE = (process.env.SITE_URL || 'https://guanshi.aijianli.xin').replace(/\/+$/, '')
const DIST = path.resolve('dist')
const SSR_ENTRY = path.resolve('dist-ssr/entry-server.js')
const MANIFEST = path.join(DIST, '.vite/manifest.json')

const { render, ALL, collections } = await import(pathToFileURL(SSR_ENTRY).href)
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const safeJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
const abs = (u) => (!u ? '' : /^https?:\/\//.test(u) ? u : SITE + (u.startsWith('/') ? u : '/' + u))

// 页面对应的懒加载 chunk 及其依赖：modulepreload，缩短 hydrate 前的等待
function preloadsFor(src) {
  const out = new Set()
  const walk = (key) => {
    const c = manifest[key]
    if (!c || c.isEntry) return
    if (out.has(c.file)) return
    out.add(c.file)
    for (const k of c.imports || []) walk(k)
  }
  walk(src)
  return [...out].map((f) => '<link rel="modulepreload" crossorigin href="/' + f + '">').join('\n    ')
}
const PRELOAD = {
  detail: preloadsFor('src/pages/Detail.jsx'),
  collection: preloadsFor('src/pages/Collection.jsx'),
  collections: preloadsFor('src/pages/Collections.jsx'),
}

function sub(html, re, value, what) {
  if (!re.test(html)) throw new Error('template missing ' + what)
  return html.replace(re, value)
}

function page({ url, title, desc, type = 'website', image, jsonld, preload = '', data, body }) {
  const fullTitle = title + ' · 观史'
  let h = template
  h = sub(h, /<title>[^<]*<\/title>/, '<title>' + esc(fullTitle) + '</title>', 'title')
  h = sub(h, /<meta name="description" content="[^"]*"\s*\/?>/, '<meta name="description" content="' + esc(desc) + '" />', 'description')
  h = sub(h, /<meta property="og:type" content="[^"]*"\s*\/?>/, '<meta property="og:type" content="' + type + '" />', 'og:type')
  h = sub(h, /<meta property="og:title" content="[^"]*"\s*\/?>/, '<meta property="og:title" content="' + esc(fullTitle) + '" />', 'og:title')
  h = sub(h, /<meta property="og:description" content="[^"]*"\s*\/?>/, '<meta property="og:description" content="' + esc(desc) + '" />', 'og:description')
  const head = [
    '<link rel="canonical" href="' + esc(SITE + url) + '" />',
    '<meta property="og:url" content="' + esc(SITE + url) + '" />',
    image ? '<meta property="og:image" content="' + esc(abs(image)) + '" />' : '',
    '<meta name="twitter:card" content="' + (image ? 'summary_large_image' : 'summary') + '" />',
    jsonld ? '<script type="application/ld+json">' + safeJson(jsonld) + '</script>' : '',
    preload,
  ].filter(Boolean).join('\n    ')
  h = sub(h, /<\/head>/, '    ' + head + '\n  </head>', 'head')
  const dataTag = data ? '\n    <script type="application/json" id="entity-data">' + safeJson(data) + '</script>' : ''
  h = sub(h, /<div id="root"><\/div>/, '<div id="root">' + body + '</div>' + dataTag, 'root')
  return h
}

function write(rel, content) {
  const p = path.join(DIST, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content)
}

const t0 = Date.now()
let bytes = 0

for (const e of ALL) {
  const url = '/entity/' + e.id
  const body = await render(url, e)
  if (!body.includes('class="para"')) throw new Error('prerender produced no body text: ' + e.id)
  const html = page({
    url,
    title: e.name,
    desc: (e.kicker ? e.kicker + '。' : '') + (e.summary || ''),
    type: 'article',
    image: e.image && e.image.src,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: e.name,
      alternativeHeadline: e.foreign || undefined,
      description: e.summary,
      image: e.image ? [abs(e.image.src)] : undefined,
      inLanguage: 'zh-CN',
      mainEntityOfPage: SITE + url,
      publisher: { '@type': 'Organization', name: '观史', url: SITE },
    },
    preload: PRELOAD.detail,
    data: e,
    body,
  })
  write('entity/' + e.id + '.html', html)
  write('data/entity/' + e.id + '.json', JSON.stringify(e))
  bytes += html.length
}

write('collections.html', page({
  url: '/collections',
  title: '专题',
  desc: '编辑精选的阅读路线：跟着路线读历史，每条路线都是一段完整的故事。',
  preload: PRELOAD.collections,
  body: await render('/collections'),
}))
for (const c of collections) {
  const url = '/collection/' + c.id
  write('collection/' + c.id + '.html', page({
    url,
    title: '专题 · ' + c.name,
    desc: c.summary,
    preload: PRELOAD.collection,
    body: await render(url),
  }))
}

// sitemap + robots
const today = new Date().toISOString().slice(0, 10)
const urls = ['/', '/timeline', '/browse', '/map', '/globe', '/collections',
  ...collections.map((c) => '/collection/' + c.id),
  ...ALL.map((e) => '/entity/' + e.id)]
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => '  <url><loc>' + esc(SITE + u) + '</loc><lastmod>' + today + '</lastmod></url>').join('\n') + '\n</urlset>\n')
write('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n')

// 构建清单只供本脚本使用，不发布
fs.rmSync(path.join(DIST, '.vite'), { recursive: true, force: true })

console.log('prerender: ' + ALL.length + ' entities + ' + (collections.length + 1) + ' collection pages, ' +
  urls.length + ' sitemap urls, avg ' + Math.round(bytes / ALL.length / 1024) + 'KB/page, ' + ((Date.now() - t0) / 1000).toFixed(1) + 's')
