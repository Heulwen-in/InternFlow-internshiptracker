import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function App() {
  const [health, setHealth] = useState({ status: 'loading', message: '' })

  useEffect(() => {
    let cancelled = false

    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setHealth(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setHealth({ status: 'error', message: err.message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="app">
      <header className="app__header">
        <h1>InternFlow</h1>
        <p className="app__tagline">Track every internship and job application in one place.</p>
      </header>

      <section className="app__status" data-status={health.status}>
        <span className="app__status-dot" />
        <span>API: {health.status}{health.message ? ` — ${health.message}` : ''}</span>
      </section>

      <section className="app__next">
        <h2>Next up</h2>
        <ul>
          <li>Wire up authentication (register / login)</li>
          <li>Build the applications dashboard</li>
          <li>Add company management</li>
        </ul>
      </section>
    </main>
  )
}

export default App
