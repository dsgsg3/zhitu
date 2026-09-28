// 构建期生成 dist/sw.js：从 vite manifest 收集 hash 资产作为预缓存清单
// 用法：vite build 之后执行（package.json build 链中已接好）
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const dist = resolve(root, 'dist')
// Vite 5+ 默认写到 dist/.vite/manifest.json，兼容旧位置
const manifestPath = resolve(dist, '.vite/manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

const precache = new Set(['/', '/index.html'])
for (const entry of Object.values(manifest)) {
  if (entry.file) precache.add('/' + entry.file)
  if (entry.css) entry.css.forEach((f) => precache.add('/' + f))
  if (entry.assets) entry.assets.forEach((f) => precache.add('/' + f))
}
for (const p of [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/fonts/noto-serif-sc-var.woff2',
  '/fonts/space-grotesk-var.woff2',
]) precache.add(p)

const template = readFileSync(resolve(root, 'tools/sw-template.js'), 'utf8')
const sw = template
  .replace('__BUILD_ID__', String(Date.now()))
  .replace('__PRECACHE__', JSON.stringify([...precache]))
writeFileSync(resolve(dist, 'sw.js'), sw)
console.log(`[gen-sw] precache ${precache.size} urls -> dist/sw.js`)
