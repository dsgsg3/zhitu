import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="brand mini">
        <span className="brand-mark">史</span>
        <span className="brand-copy">
          <strong>观史</strong>
          <small>看见过去</small>
        </span>
      </div>
      <p>把五千年握在手里，让历史成为一种可以漫游的经验。</p>
      <span>© 2026 观史 · 内容为学习用途整理初稿</span>
    </footer>
  )
}
