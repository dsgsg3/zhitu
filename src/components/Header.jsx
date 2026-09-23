import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getTheme, applyTheme } from '../theme.js'
import { SLIM } from '../data/slim-index.js'
import { CATEGORIES, formatYear } from '../data/taxonomy.js'

const NAV = [
  { to: '/', label: '首页' },
  { to: '/timeline', label: '时间轴' },
  { to: '/browse', label: '浏览' },
  { to: '/collections', label: '专题' },
]

export default function Header() {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState([])
  const [total, setTotal] = useState(null)
  const [active, setActive] = useState(0)
  const [theme, setTheme] = useState(getTheme)
  const inputRef = useRef(null)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  const randomGo = useCallback(() => {
    if (!SLIM.length) return
    const e = SLIM[Math.floor(Math.random() * SLIM.length)]
    navigate('/entity/' + e.id)
  }, [navigate])

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    import('../data/index.js').then(({ ALL }) => setTotal(ALL.length))
  }, [])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setQuery('')
    setHits([])
    setActive(0)
  }, [])

  // ⌘K / Ctrl+K 全局唤起
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (searchOpen) closeSearch()
        else openSearch()
      }
      if (e.key === 'Escape' && searchOpen) closeSearch()
      if (e.key.toLowerCase() === 'r' && !searchOpen && !e.metaKey && !e.ctrlKey && e.target.tagName !== 'INPUT') randomGo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen, openSearch, closeSearch, randomGo])

  useEffect(() => {
    if (!query.trim()) return
    let cancelled = false
    import('../data/index.js').then(({ search }) => {
      if (cancelled) return
      setHits(search(query).slice(0, 8))
      setActive(0)
    })
    return () => { cancelled = true }
  }, [query])

  const onQueryChange = (e) => {
    const v = e.target.value
    setQuery(v)
    if (!v.trim()) {
      setHits([])
      setActive(0)
    }
  }

  const go = (id) => {
    closeSearch()
    navigate(`/entity/${id}`)
  }

  // 命中词高亮（子串命中才标红，拼音命中不标）
  const Hi = ({ text }) => {
    const t = String(text)
    const needle = query.trim()
    if (!needle) return t
    const i = t.toLowerCase().indexOf(needle.toLowerCase())
    if (i === -1) return t
    return <>{t.slice(0, i)}<mark>{t.slice(i, i + needle.length)}</mark>{t.slice(i + needle.length)}</>
  }

  const onInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (hits[active]) go(hits[active].id)
    }
  }

  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark">史</span>
          <span className="brand-copy">
            <strong>观史</strong>
            <small>SEE THE PAST</small>
          </span>
        </Link>
        <nav className="top-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <button className="search-trigger" onClick={openSearch}>
            <span>⌕</span>
            <span>搜索五千年</span>
            <kbd>⌘K</kbd>
          </button>
          <button
            className="theme-toggle"
            onClick={randomGo}
            aria-label="随机一条"
            title="随机一条（R）"
          >
            🎲
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换到日间' : '切换到夜间'}
            title={theme === 'dark' ? '切换到日间' : '切换到夜间'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-overlay" onClick={(e) => e.target === e.currentTarget && closeSearch()}>
          <div className="search-panel">
            <button className="modal-close" onClick={closeSearch} aria-label="关闭">×</button>
            <p className="eyebrow">搜索</p>
            <h2>{total ? `搜索 ${total} 段历史` : '搜索历史档案'}</h2>
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={onQueryChange}
              onKeyDown={onInputKeyDown}
              placeholder="长安、罗塞塔、居里夫人、安史之乱…"
              aria-label="搜索历史档案"
            />
            <div className="search-results">
              {query === '' ? (
                <div className="search-hint">
                  试试：
                  {['李白', '丝绸之路', '兵马俑', '黑死病'].map((w) => (
                    <button key={w} className="hint-chip" onClick={() => setQuery(w)}>{w}</button>
                  ))}
                </div>
              ) : hits.length === 0 ? (
                <p className="search-hint">没有找到「{query}」，换个关键词试试。</p>
              ) : (
                hits.map((h, i) => (
                  <Link
                    key={h.id}
                    to={`/entity/${h.id}`}
                    className={`result-item${i === active ? ' active' : ''}`}
                    onClick={closeSearch}
                    onMouseEnter={() => setActive(i)}
                  >
                    <span><Hi text={h.name} /></span>
                    <small>{CATEGORIES.find((c) => c.key === h.category)?.short} · {formatYear(h.year)} →</small>
                  </Link>
                ))
              )}
            </div>
            {hits.length > 0 && (
              <p className="search-foot">↑↓ 选择 · Enter 打开 · Esc 关闭</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
