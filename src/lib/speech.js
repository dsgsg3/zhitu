// 朗读：Web Speech API，零依赖。按句切块排队，避免长文本被引擎截断。
let speaking = false
const listeners = new Set()

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
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
  speaking = false
  emit()
}

export function speakText(rawText) {
  const synth = typeof window !== 'undefined' && window.speechSynthesis
  if (!synth) return false
  synth.cancel()
  const clean = String(rawText || '').replace(/\s+/g, ' ').trim()
  if (!clean) return false
  const chunks = []
  let buf = ''
  for (const part of clean.split(/(?<=[。！？!?；;])/)) {
    if ((buf + part).length > 180) { if (buf) chunks.push(buf); buf = part } else { buf += part }
  }
  if (buf) chunks.push(buf)
  const voices = synth.getVoices()
  const zh = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('zh'))
  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c)
    if (zh) u.voice = zh
    u.lang = (zh && zh.lang) || 'zh-CN'
    u.rate = 1
    if (i === chunks.length - 1) u.onend = () => { speaking = false; emit() }
    u.onerror = () => { speaking = false; emit() }
    synth.speak(u)
  })
  speaking = chunks.length > 0
  emit()
  return true
}