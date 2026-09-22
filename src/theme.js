// 夜间模式：CSS 变量翻转，偏好存 localStorage。
// 首屏防闪烁靠 index.html 内联小脚本（绘制前就定主题），这里只管切换。
const KEY = 'guanshi:theme'
const DARK_BG = '#171512'
const LIGHT_BG = '#f7f4ec'

export function getTheme() {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'dark' || t === 'light') return t
  } catch {
    // 隐私模式等读失败时默认浅色
  }
  return 'light'
}

export function applyTheme(t) {
  const dark = t === 'dark'
  if (dark) document.documentElement.dataset.theme = 'dark'
  else delete document.documentElement.dataset.theme
  try {
    localStorage.setItem(KEY, dark ? 'dark' : 'light')
  } catch {
    // 写失败静默
  }
  const m = document.querySelector('meta[name="theme-color"]')
  if (m) m.setAttribute('content', dark ? DARK_BG : LIGHT_BG)
}
