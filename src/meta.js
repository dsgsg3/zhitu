// 站内跳转时同步标签页标题与 meta description；
// 详情页与专题页的首屏 meta 由构建期预渲染写进 HTML（tools/prerender.mjs）。
const DEFAULT_TITLE = '观史 · 把五千年历史握在手里'
const DEFAULT_DESC = '文明、人物、文物与事件，在时间轴上相遇。'

export function setPageMeta(title, desc) {
  document.title = title ? `${title} · 观史` : DEFAULT_TITLE
  const tag = document.querySelector('meta[name="description"]')
  if (tag) tag.setAttribute('content', desc || DEFAULT_DESC)
}
