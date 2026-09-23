// 轻量关键词匹配：只依赖 pinyin-match，不拉 3MB 全量数据。
// 精简条目（无 paragraphs/sections）同样可用——此时只匹配名字/外文/标签/摘要。
import PinyinMatch from 'pinyin-match'

// 统一关键词命中（搜索框与档案库共用）：名字 > 外文名 > 标签 > 摘要 > 正文 > 扩展章节。
// 中文支持拼音/首字母（如 tang、tbl 命中唐）；返回命中字段序号，未命中 -1。
export function matchScore(entity, rawQuery) {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return -1
  const pools = [
    entity.name || '',
    entity.foreign || '',
    entity.kicker || '',
    entity.summary || '',
    (entity.paragraphs || []).join(' '),
    (entity.sections || []).map((s) => s.heading + ' ' + s.paragraphs.join(' ')).join(' '),
  ]
  for (let i = 0; i < pools.length; i++) {
    const text = pools[i]
    if (!text) continue
    if (text.toLowerCase().includes(q)) return i
    if (/[\u4e00-\u9fa5]/.test(text) && /[a-z]/.test(q)) {
      try {
        if (PinyinMatch.match(text, q)) return i + 0.5
      } catch {
        // 拼音库异常时退化为普通子串匹配
      }
    }
  }
  return -1
}

export function matchesKeyword(entity, rawQuery) {
  return matchScore(entity, rawQuery) >= 0
}
