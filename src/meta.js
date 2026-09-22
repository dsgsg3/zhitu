// 路由级标题与描述：CSR 做不到爬虫可见的 SSR meta，
// 但至少保证标签页标题正确、meta description 与内容一致。
const DEFAULT_TITLE = '观史 · 把五千年历史握在手里'
const DEFAULT_DESC = '文明、人物、文物与事件，在时间轴上相遇。'

export function setPageMeta(title, desc) {
  document.title = title ? `${title} · 观史` : DEFAULT_TITLE
  const tag = document.querySelector('meta[name="description"]')
  if (tag) tag.setAttribute('content', desc || DEFAULT_DESC)
}
