import { useMemo, useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import NotFound from './NotFound.jsx'
import { setPageMeta } from '../meta.js'
import { useFootprint, markRead, toggleFav, isFav } from '../store.js'
import { useData } from '../data/useData.js'
import { CATEGORIES, REGIONS, ERAS, eraOf, eraLabel, formatYear } from '../data/taxonomy.js'
import { EntityCard } from '../components/EntityCard.jsx'
import { speakLong, speakText, stopSpeak, isSpeaking, getMode, onSpeechChange, ttsSupported, playPrebuilt } from '../lib/speech.js'

export default function Detail() {
  const { id } = useParams()
  // 全量数据按需加载：首屏只带 194KB 精简索引，正文 chunk 到了再渲染
  // 注意：loading 判断必须放在所有 Hook 之后，保持 Hook 顺序稳定
  const mod = useData()
  const byId = mod ? mod.byId : {}
  const ALL = mod ? mod.ALL : []
  const entity = byId[id]

  // 实体的时间锚点：有区间取中点，否则取年份
  const mid = (e) => (e.range ? (e.range[0] + (e.range[1] ?? e.range[0])) / 2 : e.year)
  const anchorYear = entity ? Math.round(mid(entity)) : 0

  // 同期世界：锚点年份前后 120 年内的其他实体（排除自身）
  // 必须写在下面的 early return 之前，否则 Hook 数量随路由变化，React 会报错
  const sameEra = useMemo(() => {
    if (!entity) return []
    return ALL
      .filter((e) => e.id !== entity.id && Math.abs(mid(e) - anchorYear) <= 120)
      .sort((a, b) => Math.abs(mid(a) - anchorYear) - Math.abs(mid(b) - anchorYear))
      .slice(0, 6)
  }, [entity, anchorYear])

  // 时间上的上一篇 / 下一篇（按锚点年份排序）
  // 同样必须写在 early return 之前，保证 Hook 顺序稳定
  const neighbors = useMemo(() => {
    if (!entity) return { prev: null, next: null }
    const sorted = [...ALL].sort((a, b) => a.year - b.year)
    const i = sorted.findIndex((e) => e.id === entity.id)
    return { prev: sorted[i - 1] || null, next: sorted[i + 1] || null }
  }, [entity])

  useEffect(() => {
    if (entity) setPageMeta(entity.name, entity.summary)
  }, [entity])

  // 打开即记为已读（写 localStorage，手下留情：只记一次）
  const snap = useFootprint()
  useEffect(() => {
    if (entity) markRead(entity.id)
  }, [entity])
  const fav = entity ? isFav(entity.id, snap) : false
  const [speaking, setSpeaking] = useState(false)
  const [ttsMsg, setTtsMsg] = useState('')
  const [audioReady, setAudioReady] = useState(false)
  const [mode, setMode] = useState('')
  useEffect(() => {
    if (entity) {
      fetch('/audio/' + entity.id + '.mp3', { method: 'HEAD' })
        .then((r) => setAudioReady(r.ok))
        .catch(() => setAudioReady(false))
    }
    const un = onSpeechChange(() => { setSpeaking(isSpeaking()); setMode(getMode()) })
    return () => { stopSpeak(); un() }
  }, [entity])
  const speakEntry = async () => {
    if (!entity || mode) return
    const paras = (entity.paragraphs || []).join(' ')
    const secs = (entity.sections || []).map((s) => s.heading + '。' + s.paragraphs.join(' ')).join(' ')
    const text = entity.name + '。' + (entity.summary || '') + '。' + paras + secs
    setTtsMsg('')
    // 预生成音频优先：秒开；没有则走在线合成
    try {
      const played = await playPrebuilt(entity.id, entity.name)
      if (played) return
    } catch (e) { /* fall through */ }
    try {
      await speakLong(text, entity.name)
    } catch (e) {
      if (ttsSupported()) {
        const r = speakText(text)
        setTtsMsg(r.ok ? '' : '朗读启动失败，请重试或调高媒体音量')
      } else {
        setTtsMsg('在线语音生成失败，请稍后重试')
      }
    }
  }

  // 阅读进度：顶部细线
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setProgress(max > 0 ? Math.min(1, h.scrollTop / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [entity])

  // 头图滚动视差：图随滚动微移（±28px），直接写 DOM 不重渲染
  const figRef = useRef(null)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = figRef.current
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const r = el.getBoundingClientRect()
        const center = r.top + r.height / 2 - window.innerHeight / 2
        const dy = Math.max(-28, Math.min(28, -center * 0.08))
        el.style.setProperty('--py', `${dy.toFixed(1)}px`)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [entity])

  if (!mod) return <div className="route-loading">档案载入中…</div>
  if (!entity) return <NotFound />

  const cat = CATEGORIES.find((c) => c.key === entity.category)
  const region = REGIONS.find((r) => r.key === entity.region)
  const eraKey = eraOf(entity.year)

  const related = (entity.related || []).map((rid) => byId[rid]).filter(Boolean)

  // 出处：有则展示，无则给一条维基检索兜底（检索页恒成立，不会 404）
  const sources = entity.sources && entity.sources.length > 0
    ? entity.sources
    : [{ label: '维基百科检索', url: `https://zh.wikipedia.org/w/index.php?search=${encodeURIComponent(entity.name)}` }]

  return (
    <main className="detail-page" style={{ '--cat': cat.accent }}>
      <div className="read-progress" aria-hidden="true" style={{ transform: `scaleX(${progress})` }} />
      <section className="detail-hero">
        <div className="detail-hero-inner">
          <div className="detail-crumb">
            <Link to="/">首页</Link> / <Link to={`/browse?cat=${entity.category}`}>{cat.label}</Link> / {entity.name}
          </div>
          <div className="detail-kicker">
            <span className="cat-tag" style={{ '--cat': cat.accent }}>{cat.icon} {cat.label}</span>
            {region && <span className="cat-tag" style={{ '--cat': 'var(--ink-soft)' }}>{region.label}</span>}
            {eraKey && <span className="cat-tag" style={{ '--cat': 'var(--ink-soft)' }}>{eraLabel(eraKey)?.short}</span>}
          </div>
          <h1>{entity.name}</h1>
          {entity.foreign && <p className="detail-foreign">{entity.foreign}</p>}
          <p className="detail-summary">{entity.summary}</p>
          <div className="detail-range">
            <span className="bar" />
            {entity.range
              ? `${formatYear(entity.range[0])} — ${formatYear(entity.range[1] ?? entity.range[0])}`
              : formatYear(entity.year)}
            <span style={{ color: 'var(--ink-faint)' }}>· {entity.kicker}</span>
          </div>
          <div className="detail-actions">
            <button className={`button${fav ? ' button-solid' : ''}`} onClick={() => toggleFav(entity.id)}>
              {fav ? '★ 已收藏' : '☆ 收藏这一段'}
            </button>
            <button className={'button' + (speaking || mode ? ' button-solid' : '')} onClick={() => (mode || speaking ? stopSpeak() : speakEntry())} disabled={mode === 'loading'}>
              {mode === 'loading' ? '⏳ 合成语音…' : speaking ? '■ 停止朗读' : '▶ 朗读（在线语音）'}
            </button>
            {audioReady && (
              <a className='button' href={'/audio/' + entity.id + '.mp3'} download={entity.name + '.mp3'}>
                ⤓ 下载音频
              </a>
            )}
            {ttsMsg && <span className='tts-msg'>{ttsMsg}</span>}
            {!audioReady && !speaking && !ttsMsg && <span className='tts-msg tts-info'>提示：音频生成中，稍后可下载离线收听；当前可点「朗读」在线播放。</span>}
          </div>
          {entity.image && (
            <figure className="detail-figure" ref={figRef}>
              <img
                src={entity.image.src}
                alt={entity.name}
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.closest('.detail-figure')?.remove() }}
              />
              <figcaption>
                图：{entity.image.author} · {entity.image.license}
                {' · '}
                <a href={entity.image.page} target="_blank" rel="noreferrer">Wikimedia Commons ↗</a>
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      <div className="detail-body">
        <article className="detail-article">
          {entity.paragraphs?.map((p, i) => <p key={i} className="para">{p}</p>)}
          {entity.sections?.map((sec, si) => (
            <section key={si} className="detail-section">
              <h2 className="detail-sec-h">{sec.heading}</h2>
              {sec.paragraphs.map((pj, j) => <p key={j} className="para">{pj}</p>)}
            </section>
          ))}
          {entity.quote && (
            <blockquote className="detail-quote">
              <p>“{entity.quote}”</p>
              <cite>— {entity.quoteBy}</cite>
            </blockquote>
          )}
        </article>

        <aside className="detail-side">
          {entity.facts && (
            <div className="facts-card">
              <h4>关键事实</h4>
              {entity.facts.map((f, i) => (
                <div className="fact-row" key={i}>
                  <span>{f.label}</span>
                  <b>{f.value}</b>
                </div>
              ))}
            </div>
          )}
          {related.length > 0 && (
            <div className="related-card">
              <h4>关联历史</h4>
              {related.map((r) => {
                const rc = CATEGORIES.find((c) => c.key === r.category)
                return (
                  <Link key={r.id} to={`/entity/${r.id}`} className="related-item">
                    <span className="r-name">{r.name}</span>
                    <span className="r-meta">{rc.short} · {formatYear(r.range ? r.range[0] : r.year)}</span>
                  </Link>
                )
              })}
            </div>
          )}
          <div className="related-card">
            <h4>参考与延伸</h4>
            {sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer" className="related-item">
                <span className="r-name">{s.label}</span>
                <span className="r-meta">↗</span>
              </a>
            ))}
          </div>
        </aside>
      </div>

      {sameEra.length > 0 && (
        <section className="sameera-section">
          <h3>同期世界</h3>
          <p className="sameera-sub">约 {formatYear(anchorYear)} 前后，这些也在发生 —</p>
          <div className="sameera-grid">
            {sameEra.map((e) => <EntityCard key={e.id} entity={e} />)}
          </div>
        </section>
      )}

      <nav className="detail-nav" aria-label="按时间浏览">
        {neighbors.prev ? (
          <Link to={`/entity/${neighbors.prev.id}`} className="detail-nav-item">
            <small>← 更早 · {formatYear(neighbors.prev.range ? neighbors.prev.range[0] : neighbors.prev.year)}</small>
            <strong>{neighbors.prev.name}</strong>
          </Link>
        ) : <span />}
        {neighbors.next ? (
          <Link to={`/entity/${neighbors.next.id}`} className="detail-nav-item next">
            <small>{formatYear(neighbors.next.range ? neighbors.next.range[0] : neighbors.next.year)} · 更晚 →</small>
            <strong>{neighbors.next.name}</strong>
          </Link>
        ) : <span />}
      </nav>
    </main>
  )
}
