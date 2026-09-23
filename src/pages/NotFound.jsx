import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { setPageMeta } from '../meta.js'
import { SLIM } from '../data/slim-index.js'

export default function NotFound() {
  useEffect(() => { setPageMeta('页面不存在', '你要找的页面不在时间里。') }, [])
  // 随机推荐：useState 初始化器允许非纯计算，只跑一次
  const [roam] = useState(() => SLIM[Math.floor(Math.random() * SLIM.length)])
  return (
    <main className="browse-page">
      <div className="browse-head">
        <p className="eyebrow">404 · 迷失在时间里</p>
        <h1>这里没有历史</h1>
        <p>你要找的页面不存在——可能 id 写错了，或者它还没被写进时间。</p>
      </div>
      <div className="hero-actions">
        <Link to="/" className="button button-solid">回到首页</Link>
        <Link to="/timeline" className="button">进入时间轴</Link>
        {roam && <Link to={`/entity/${roam.id}`} className="button">随机去一段历史 ✦</Link>}
      </div>
    </main>
  )
}
