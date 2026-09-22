// 世界通史分期：不按中国王朝切分，否则罗马会被算进「先秦」
// 每个 era 的 range 左闭右开，eraOf() 依此归类
export const ERAS = [
  { key: 'ancient', label: '文明曙光 · 上古', short: '上古', range: [-3000, -800] },
  { key: 'classical', label: '古典时代 · 帝国', short: '古典', range: [-800, 500] },
  { key: 'medieval', label: '中古 · 信仰与征服', short: '中古', range: [500, 1400] },
  { key: 'earlymodern', label: '近代 · 大航海与启蒙', short: '近代', range: [1400, 1800] },
  { key: 'modern', label: '现代 · 工业与革命', short: '现代', range: [1800, 2000] },
]

// accent 为纸感底色上的低饱和四色：赭 / 朱 / 青铜绿 / 靛
export const CATEGORIES = [
  { key: 'civilization', label: '文明 · 国家', short: '文明', icon: '◇', accent: '#8C6A3F' },
  { key: 'figure', label: '人物', short: '人物', icon: '○', accent: '#B23A2E' },
  { key: 'artifact', label: '文物', short: '文物', icon: '□', accent: '#4F6F52' },
  { key: 'event', label: '事件', short: '事件', icon: '△', accent: '#3E5C8A' },
]

export const REGIONS = [
  { key: 'china', label: '中国' },
  { key: 'east-asia', label: '东亚其他' },
  { key: 'middle-east', label: '西亚 · 中东' },
  { key: 'south-asia', label: '南亚' },
  { key: 'europe', label: '欧洲' },
  { key: 'africa', label: '非洲' },
  { key: 'americas', label: '美洲' },
]

export function formatYear(y) {
  if (y < 0) return `前 ${Math.abs(y)} 年`
  return `${y} 年`
}

export function formatRange([a, b]) {
  return `${formatYear(a)} — ${formatYear(b)}`
}

export function eraOf(year) {
  if (year == null) return 'modern'
  for (const era of ERAS) {
    const [a, b] = era.range
    if (year >= a && year < b) return era.key
  }
  // 超出表外：更早归入上古，更晚归入现代
  return year < ERAS[0].range[0] ? 'ancient' : 'modern'
}

export function eraLabel(key) {
  return ERAS.find((e) => e.key === key) || null
}
