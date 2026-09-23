import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import BackToTop from './components/BackToTop.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Timeline = lazy(() => import('./pages/Timeline.jsx'))
const Browse = lazy(() => import('./pages/Browse.jsx'))
const Detail = lazy(() => import('./pages/Detail.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const Collections = lazy(() => import('./pages/Collections.jsx'))
const MapPage = lazy(() => import('./pages/MapPage.jsx'))
const GlobePage = lazy(() => import('./pages/GlobePage.jsx'))
const Collection = lazy(() => import('./pages/Collection.jsx'))

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<div className="route-loading">载入中…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/entity/:id" element={<Detail />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/globe" element={<GlobePage />} />
            <Route path="/collection/:id" element={<Collection />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Footer />
      <BackToTop />
    </div>
  )
}
