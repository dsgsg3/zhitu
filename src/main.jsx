import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/fonts.css'
import './styles/global.css'
import './styles/home.css'
import './styles/timeline.css'
import './styles/browse.css'
import './styles/detail.css'

const root = document.getElementById('root')
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
// Prerendered pages (tools/prerender.mjs) ship HTML inside #root: hydrate it; plain SPA routes render fresh
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app)
else ReactDOM.createRoot(root).render(app)

// PWA：生产环境注册 Service Worker（由 tools/gen-sw.mjs 在构建期生成 dist/sw.js）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
