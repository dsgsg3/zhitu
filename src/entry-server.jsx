// SSR entry for build-time prerendering only (tools/prerender.mjs). Not shipped to browsers.
/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import { seedEntity } from './data/useData.js'

export { ALL } from './data/index.js'
export { collections } from './data/collections.js'

const renderOnce = (url) => renderToString(
  <StrictMode>
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  </StrictMode>,
)

const FALLBACK = 'class="route-loading"'
const tick = () => new Promise((r) => setTimeout(r, 10))

// React.lazy suspends on the first render of each route (the Suspense fallback is emitted),
// which also kicks off the chunk import; once it resolves, later renders are complete and synchronous.
export async function render(url, entity) {
  if (entity) seedEntity(entity)
  let html = renderOnce(url)
  for (let i = 0; i < 200 && html.includes(FALLBACK); i++) {
    await tick()
    html = renderOnce(url)
  }
  if (html.includes(FALLBACK)) throw new Error('route never resolved: ' + url)
  return html
}
