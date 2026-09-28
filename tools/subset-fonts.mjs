// 本地字体子集化：新增档案用到生僻字后重跑 `npm run fonts`
// 源 TTF 会缓存到 .fontcache/（已 gitignore），二次运行无需网络
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import subsetFont from 'subset-font'

const root = process.cwd()
const cacheDir = resolve(root, '.fontcache')
mkdirSync(cacheDir, { recursive: true })

async function ensureFont(file, url) {
  const p = join(cacheDir, file)
  if (existsSync(p)) return p
  console.log('[fonts] 下载', file, '…')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${file} 下载失败: HTTP ${res.status}`)
  writeFileSync(p, Buffer.from(await res.arrayBuffer()))
  return p
}

function collectChars() {
  const chars = new Set()
  const walk = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n)
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.(jsx?|html)$/.test(n)) for (const ch of readFileSync(p, 'utf8')) chars.add(ch)
    }
  }
  walk(resolve(root, 'src'))
  for (const ch of readFileSync(resolve(root, 'index.html'), 'utf8')) chars.add(ch)
  const safety = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~' +
    '·—…「」『』《》〈〉（）【】、。，：；！？￥％°±×÷前公元年月日时分秒世纪年代'
  for (const ch of safety) chars.add(ch)
  chars.delete('\n'); chars.delete('\r'); chars.delete('\t')
  return [...chars].join('')
}

const jobs = [
  {
    out: 'public/fonts/noto-serif-sc-var.woff2',
    file: 'NotoSerifSC-var.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf',
  },
  {
    out: 'public/fonts/space-grotesk-var.woff2',
    file: 'SpaceGrotesk-var.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf',
  },
]

const chars = collectChars()
console.log('[fonts] 项目用字', chars.length, '个')
for (const job of jobs) {
  const input = await ensureFont(job.file, job.url)
  const out = await subsetFont(readFileSync(input), chars, { targetFormat: 'woff2', preserveNameIds: [1, 2] })
  writeFileSync(resolve(root, job.out), out)
  console.log('[fonts]', job.out, (out.length / 1024).toFixed(1) + ' KB')
}
console.log('[fonts] 完成')
