// 朗读 v2：移动端兼容强化版。
// - 不用 lookbehind 正则（老 Safari < 16.4 会整模块解析失败）
// - 分句 ≤120 字（规避安卓 Chrome 长文本 15 秒暂停）
// - 朗读中每 8 秒 pause/resume 保活（安卓 Chrome 已知 bug 的通用补丁）
// - 不支持的环境给出明确原因
let speaking = false
let keepalive = null
const listeners = new Set()

export function ttsSupported() {
  return typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
}

export function isSpeaking() {
  return speaking
}

export function onSpeechChange(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

function emit() {
  for (const l of listeners) l()
}

export function stopSpeak() {
  if (ttsSupported()) window.speechSynthesis.cancel()
  if (keepalive) { clearInterval(keepalive); keepalive = null }
  speaking = false
  emit()
}

function pickVoice(synth) {
  const voices = synth.getVoices()
  if (!voices.length) return null
  return voices.find((v) => (v.lang || '').toLowerCase().startsWith('zh')) ||
    voices.find((v) => /Chinese|中文/i.test(v.name)) ||
    null
}

function splitSentences(text) {
  // 兼容写法：标点后插入分隔符再切，不用 lookbehind
  const marked = text.replace(/([。！？!?；;])/g, '$1\u0001')
  return marked.split('\u0001').map((s) => s.trim()).filter(Boolean)
}

export function speakText(rawText) {
  if (!ttsSupported()) return { ok: false, reason: 'unsupported' }
  const synth = window.speechSynthesis
  synth.cancel()
  const clean = String(rawText || '').replace(/\s+/g, ' ').trim()
  if (!clean) return { ok: false, reason: 'empty' }
  const chunks = []
  let buf = ''
  for (const part of splitSentences(clean)) {
    if ((buf + part).length > 120) { if (buf) chunks.push(buf); buf = part } else { buf += part }
  }
  if (buf) chunks.push(buf)
  const zh = pickVoice(synth)
  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c)
    if (zh) u.voice = zh
    u.lang = (zh && zh.lang) || 'zh-CN'
    u.rate = 1
    if (i === chunks.length - 1) u.onend = () => { if (keepalive) { clearInterval(keepalive); keepalive = null } speaking = false; emit() }
    u.onerror = (ev) => { if (ev.error === 'interrupted' || ev.error === 'canceled') return; if (keepalive) { clearInterval(keepalive); keepalive = null } speaking = false; emit() }
    synth.speak(u)
  })
  // 安卓 Chrome：长朗读中途会被静默暂停，定期 resume 保活
  if (keepalive) clearInterval(keepalive)
  keepalive = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      window.speechSynthesis.resume()
    }
  }, 8000)
  speaking = chunks.length > 0
  emit()
  return { ok: true }
}