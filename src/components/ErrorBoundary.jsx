import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Route error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="route-error">
          <p className="eyebrow">出了点问题</p>
          <h1>这段历史暂时加载失败</h1>
          <p>{String(this.state.error?.message || this.state.error)}</p>
          <div className="hero-actions">
            <button className="button button-solid" onClick={() => this.setState({ error: null })}>重试</button>
            <a className="button" href="/">回首页</a>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
