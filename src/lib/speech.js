// 朗读 v3：MiMo 在线语音优先（任何浏览器可播）+ 系统 TTS 兜底。
const TTS_API = 'https://guanshi-tts.fanzhibao68.workers.dev/tts'

let mode = '' // '' | 'loading' | 'playing'
let audioEl = null
let chainUrls = []
let chainIdx = 0
let preloadEl = null
let currentTitle = '历史档案朗读'
let sysSpeaking = false
let keepalive = null
const listeners = new Set()

export function ttsSupported() {
  return typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
}

export function getMode() {
  return mode
}

export function isSpeaking() {
  return sysSpeaking || mode === 'playing'
}

export function onSpeechChange(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

function setMediaMetadata(title) {
  if (!('mediaSession' in navigator)) return
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || '历史档案朗读',
      artist: '观史 · 把五千年握在手里',
    })
    navigator.mediaSession.setActionHandler('play', () => { if (audioEl) audioEl.play().catch(() => {}) })
    navigator.mediaSession.setActionHandler('pause', () => { if (audioEl) audioEl.pause() })
    try { navigator.mediaSession.setActionHandler('stop', () => stopSpeak()) } catch { /* unsupported */ }
  } catch { /* mediaSession unsupported */ }
}

function setState(next) {
  mode = next.mode
  sysSpeaking = next.sysSpeaking
  for (const l of listeners) l()
}

export function stopSpeak() {
  if (audioEl) {
    audioEl.pause()
    audioEl = null
  }
  if (preloadEl) { preloadEl = null }
  chainUrls = []
  chainIdx = 0
  if (ttsSupported() && window.speechSynthesis) window.speechSynthesis.cancel()
  if (keepalive) { clearInterval(keepalive); keepalive = null }
  sysSpeaking = false
  setState({ mode: '', sysSpeaking: false })
}

export function speakText(text) {
  // 系统 TTS 兜底（原 v2 实现）
  if (!ttsSupported()) return { ok: false, reason: 'unsupported' }
  const synth = window.speechSynthesis
  synth.cancel()
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return { ok: false, reason: 'empty' }
  const marked = clean.replace(/([。！？!?；;])/g, '$1\u0001')
  const parts = marked.split('\u0001').map((s) => s.trim()).filter(Boolean)
  const chunks = []
  let buf = ''
  for (const part of parts) {
    if ((buf + part).length > 120) { if (buf) chunks.push(buf); buf = part } else { buf += part }
  }
  if (buf) chunks.push(buf)
  const voices = synth.getVoices()
  const zh = voices.find((v) => (v.lang || '').toLowerCase().startsWith('zh'))
  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c)
    if (zh) u.voice = zh
    u.lang = (zh && zh.lang) || 'zh-CN'
    if (i === chunks.length - 1) u.onend = () => { sysSpeaking = false; setState({ mode: '', sysSpeaking: false }) }
    synth.speak(u)
  })
  sysSpeaking = true
  setState({ mode: '', sysSpeaking: true })
  return { ok: true }
}

function playChain(onDone) {
  if (chainIdx >= chainUrls.length) {
    audioEl = null
    if (onDone) onDone()
    return
  }
  setMediaMetadata(currentTitle)
  if (chainUrls[chainIdx + 1]) {
    preloadEl = new Audio(chainUrls[chainIdx + 1])
    preloadEl.preload = 'auto'
    preloadEl.load()
  }
  audioEl = new Audio(chainUrls[chainIdx])
  audioEl = new Audio(chainUrls[chainIdx])
  audioEl.onended = () => { chainIdx++; playChain(onDone) }
  audioEl.onerror = () => { audioEl = null; setState({ mode: '', sysSpeaking: false }) }
  audioEl.play().catch(() => { setState({ mode: '', sysSpeaking: false }) })
}

export function playPrebuilt(id) {
  return new Promise((resolve) => {
    if (!mode && audioEl) { resolve(false); return }
    const el = new Audio('/audio/' + id + '.mp3')
    audioEl = el
    setState({ mode: 'playing', sysSpeaking: false })
    el.onended = () => { audioEl = null; setState({ mode: '', sysSpeaking: false }); resolve(true) }
    el.onerror = () => { audioEl = null; setState({ mode: '', sysSpeaking: false }); resolve(false) }
    el.play().catch(() => { audioEl = null; setState({ mode: '', sysSpeaking: false }); resolve(false) })
  })
}

export async function speakLong(text, title) {
  currentTitle = title || '历史柿案哈读'
  stopSpeak()
  setState({ mode: 'loading', sysSpeaking: false })
  // 分段合成（每段 ≤600 字，句子边界切分）
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  const marked = clean.replace(/([。！？!?；;])/g, '$1\u0001')
  const sents = marked.split('\u0001').map((s) => s.trim()).filter(Boolean)
  const parts = []
  let buf = ''
  for (const s of sents) {
    if ((buf + s).length > 600) { if (buf) parts.push(buf); buf = s } else { buf += s }
  }
  if (buf) parts.push(buf)
  chainUrls = []
  for (const part of parts) {
    const r = await fetch(TTS_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: part })
    if (!r.ok) throw new Error('TTS ' + r.status)
    const blob = await r.blob()
    chainUrls.push(URL.createObjectURL(blob))
  }
  chainIdx = 0
  setState({ mode: 'playing', sysSpeaking: false })
  playChain(() => {})
}