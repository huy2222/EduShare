import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { getCurrentUser, logout } from './services/authApi'

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#home')
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const handleRouteChange = () => setRoute(window.location.hash || '#home')
    window.addEventListener('hashchange', handleRouteChange)
    return () => window.removeEventListener('hashchange', handleRouteChange)
  }, [])

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then(() => { if (active) setAuthenticated(true) })
      .catch(() => { if (active) setAuthenticated(false) })
    return () => { active = false }
  }, [])

  const handleAuthenticated = () => {
    setAuthenticated(true)
    window.location.hash = '#home'
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // The local UI is cleared even if the network is unavailable. The
      // server-side logout endpoint remains idempotent on the next attempt.
    } finally {
      setAuthenticated(false)
      window.location.hash = '#home'
    }
  }

  if (route === '#login') return <LoginPage onAuthenticated={handleAuthenticated} />
  if (route === '#register') return <RegisterPage onAuthenticated={handleAuthenticated} />

  return <HomePage authenticated={authenticated} onLogout={handleLogout} />
}
