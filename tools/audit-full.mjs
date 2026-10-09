// 用法: npm run audit:full  或  node tools/audit-full.mjs [category]
// 全量体检：把档案在「署名合规 / 配图可用性 / 体积分布 / 内容深度 / 出处引文」五个维度上的
// 问题一次摸清，分类输出；存在 P0/P1 时以非零码退出（与 validate-data.mjs 的约定一致）。
//
// 与既有审计脚本的分工：
//   validate-data.mjs  结构合法性（id/分类/地域/年份/related/sources 格式）—— 写完条目必须跑
//   audit-img.mjs      配图字段是否为空 —— 只看结构，不看文件
//   audit-full.mjs     （本脚本）跨字段 + 跨文件系统的一致性体检，不发网络请求
import { existsSync, statSync, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { ALL } from '../src/data/index.js'
import { collections } from '../src/data/collections.js'

const only = process.argv[2] // 可选：只看某个类别 civilization|figure|artifact|event
const list = only ? ALL.filter((e) => e.category === only) : ALL

// P0 许可合规：署名字段缺失会在线上渲染成空的「图： · 」
// P1 体验缺陷：主图不可用（文件缺失 / 分辨率过低）
// P2 冗余：同字节重复图，直接浪费构建体积
// P3 提示：可疑但需人工判断
const P0 = []
const P1 = []
const P2 = []
const P3 = []
const add = (level, id, msg) => level.push({ id, msg })

// 判据必须用像素尺寸而非字节数：国旗、纹章这类扁平色块矢量图转成 PNG 后只有几百字节，
// 但分辨率完全够用（ayutthaya 960x640 仅 0.4KB）。按字节数筛会把它们整批误判成占位图。
const MIN_W = 300
const MIN_H = 300
const MAX_RATIO = 4 // 长宽比超过此值多半是裁剪失误，而非构图选择

function pixelSize(file) {
  const b = readFileSync(file)
  if (b[0] === 0x89 && b[1] === 0x50) return [b.readUInt32BE(16), b.readUInt32BE(20)] // PNG
  if (b[0] === 0x47 && b[1] === 0x49) return [b.readUInt16LE(6), b.readUInt16LE(8)] // GIF
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length - 9; ) {
      if (b[i] !== 0xff) {
        i++
        continue
      }
      const m = b[i + 1]
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)] // JPEG 的 SOF 段
      }
      i += 2 + b.readUInt16BE(i + 2)
    }
  }
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = b.toString('ascii', 12, 16)
    if (chunk === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]
    if (chunk === 'VP8L') {
      const bits = b.readUInt32LE(21)
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1]
    }
    if (chunk === 'VP8X') {
      return [1 + (b[24] | (b[25] << 8) | (b[26] << 16)), 1 + (b[27] | (b[28] << 8) | (b[29] << 16))]
    }
  }
  return null
}

const IMG_DIR = path.resolve('public/images')
const fileOf = (src) => path.resolve('public' + (src.startsWith('/') ? src : '/' + src))

// ---- 1. 署名合规（P0）--------------------------------------------
for (const e of list) {
  if (!e.image) {
    add(P3, e.id, '无配图（卡片走纯文字排版）')
    continue
  }
  const { src, page, author, license } = e.image
  const missing = []
  if (!src) missing.push('src')
  if (!page) missing.push('page')
  if (!author || !author.trim()) missing.push('author')
  if (!license || !license.trim()) missing.push('license')
  if (missing.length) {
    add(P0, e.id, `署名字段缺失: ${missing.join(', ')}`)
  }
}

// ---- 2. 配图文件可用性（P1）与体积分布 ---------------------------
const byHash = new Map()
let imgTotal = 0
const sizeBuckets = { '>=100KB': 0, '25-100KB': 0, '8-25KB': 0, '<8KB': 0 }
const extMix = {}

for (const e of list) {
  if (!e.image || !e.image.src) continue
  const file = fileOf(e.image.src)
  if (!existsSync(file)) {
    add(P1, e.id, `配图文件不存在: ${e.image.src}`)
    continue
  }
  const st = statSync(file)
  const kb = Math.round((st.size / 1024) * 10) / 10
  imgTotal += st.size
  const ext = path.extname(file).slice(1).toLowerCase() || '(none)'
  extMix[ext] = (extMix[ext] || 0) + 1

  const px = pixelSize(file)
  if (!px) {
    add(P1, e.id, `无法解析尺寸，文件可能损坏: ${e.image.src}`)
  } else {
    const [w, h] = px
    const ratio = Math.max(w, h) / Math.min(w, h)
    // 全景图天然矮（比例可到 10:1，宽度 960 已是站内标准），只要宽度达标就不该按高度判死
    const isPano = ratio > MAX_RATIO
    if (w < MIN_W) {
      add(P1, e.id, `宽度过低 ${w}x${h}，低于 ${MIN_W}px 达标线`)
    } else if (h < MIN_H && !isPano) {
      add(P1, e.id, `高度不足 ${w}x${h}，低于 ${MIN_H}px 达标线`)
    } else if (isPano) {
      add(P3, e.id, `长宽比 ${ratio.toFixed(1)}:1（${w}x${h}），全景图，高度偏低属正常`)
    }
  }
  if (kb >= 100) sizeBuckets['>=100KB']++
  else if (kb >= 25) sizeBuckets['25-100KB']++
  else if (kb >= 8) sizeBuckets['8-25KB']++
  else sizeBuckets['<8KB']++

  const h = createHash('sha1').update(readFileSync(file)).digest('hex')
  if (!byHash.has(h)) byHash.set(h, { size: st.size, ids: [] })
  byHash.get(h).ids.push({ id: e.id, src: e.image.src })
}
for (const g of byHash.values()) {
  // 多个条目共用同一文件路径是刻意复用（同一枚硬币 / 同一次首飞 / 同一幅画），
  // 只有「不同路径却字节相同」才是真正浪费磁盘的冗余。
  const paths = new Set(g.ids.map((x) => x.src))
  if (paths.size > 1) {
    const kb = Math.round((g.size / 1024) * 10) / 10
    const wasted = Math.round(((g.size * (paths.size - 1)) / 1024) * 10) / 10
    add(
      P2,
      g.ids.map((x) => x.id).join(' = '),
      `不同路径但同字节（各 ${kb}KB，可省 ${wasted}KB）: ${[...paths].join(', ')}`
    )
  }
}

// ---- 3. 孤儿文件（P2）--------------------------------------------
// public/images 里存在但没有任何条目引用的文件：会被原样拷进 dist，白占体积。
try {
  // 带类别参数时 list 只是子集，孤儿判定必须始终基于全量 ALL，否则别类图片会被整片误判为孤儿
  const onDisk = readdirSync(IMG_DIR)
  const referenced = new Set(ALL.map((e) => e.image?.src).filter(Boolean))
  const orphans = onDisk.filter((f) => !referenced.has('/images/' + f))
  if (orphans.length) {
    const totalKb = orphans.reduce(
      (n, f) => n + statSync(path.join(IMG_DIR, f)).size / 1024,
      0
    )
    add(P2, `public/images(${orphans.length} 个)`, `孤儿图：${orphans.join(', ')}（共 ${Math.round(totalKb)}KB）`)
  }
} catch {
  // 图片目录不存在时跳过
}

// ---- 4. 正文深度（P3）--------------------------------------------
function bodyLen(e) {
  return [
    ...(e.paragraphs || []),
    ...(e.sections || []).flatMap((s) => s.paragraphs || []),
  ].join('').length
}
for (const e of list) {
  const n = bodyLen(e)
  if (n < 1200) add(P3, e.id, `正文 ${n} 字，低于 deep-content-guide 的 1200 字达标线`)
}

// ---- 4. 出处与引文（P3）------------------------------------------
for (const e of list) {
  if (!e.sources || !e.sources.length) add(P3, e.id, '无 sources 出处')
  if (!e.quote || !e.quote.trim()) add(P3, e.id, '无 quote 引文')
}

// ---- 5. 专题引用（P3）--------------------------------------------
const byId = Object.fromEntries(ALL.map((e) => [e.id, e]))
for (const c of collections) {
  for (const en of c.entries || []) {
    if (!byId[en.id]) add(P3, c.id, `专题引用了不存在的 id: ${en.id}`)
  }
}

// ---- 输出 ----------------------------------------------------------
const mb = (n) => `${Math.round((n / 1024 / 1024) * 10) / 10}MB`
const section = (title, level, desc) => {
  if (!level.length) return
  console.log(`\n===== ${title}（${level.length}）${desc ? ' —— ' + desc : ''} =====`)
  for (const x of level) console.log(`  ${x.id}: ${x.msg}`)
}

const withImg = list.filter((e) => e.image?.src)
console.log(`体检范围: ${list.length} 条${only ? `（${only}）` : ''}`)
console.log(`配图文件: ${withImg.filter((e) => existsSync(fileOf(e.image.src))).length} / ${withImg.length}`)
console.log(`配图总体积: ${mb(imgTotal)}`)
console.log(`体积分布: ${Object.entries(sizeBuckets).map(([k, v]) => `${k} ${v}`).join(' · ')}`)
console.log(`格式分布: ${Object.entries(extMix).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`)

section('P0 许可合规', P0, '详情页会渲染出空白署名，必须补齐')
section('P1 配图可用性', P1, '主图缺失或疑似不可用')
section('P2 冗余配图', P2, '同字节重复，可直接复用')
section('P3 待人工确认', P3)

const total = P0.length + P1.length + P2.length + P3.length
console.log(`\n合计: P0 ${P0.length} · P1 ${P1.length} · P2 ${P2.length} · P3 ${P3.length} = ${total}`)
if (P0.length || P1.length) {
  console.log('存在需优先处理的问题（P0/P1）')
  process.exit(1)
}
console.log('体检完成，无 P0/P1 问题')