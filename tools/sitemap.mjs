// 用法: npm run sitemap -- https://your-domain
// （或 node tools/sitemap.mjs https://your-domain）
// 为 dist/ 生成 sitemap.xml：首页 / 时间轴 / 浏览 + 全部 /entity/:id。
// 部署到公网后跑一次；纯内网预览不需要。
import fs from 'node:fs'
import { ALL } from '../src/data/index.js'

const base = (process.argv[2] || '').replace(/\/+$/, '')
if (!/^https?:\/\/.+/.test(base)) {
  console.error('用法: node tools/sitemap.mjs https://your-domain')
  process.exit(1)
}
const urls = ['/', '/timeline', '/browse', ...ALL.map((e) => `/entity/${e.id}`)]
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}\n</urlset>\n`
fs.mkdirSync('dist', { recursive: true })
fs.writeFileSync('dist/sitemap.xml', xml)
console.log(`sitemap: ${urls.length} 条 -> dist/sitemap.xml`)
