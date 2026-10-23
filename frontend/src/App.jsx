import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { clearAccessToken, getAccessToken } from './services/authApi'

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || '#home')
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAccessToken()))

  useEffect(() => {
    const handleRouteChange = () => setRoute(window.location.hash || '#home')
    window.addEventListener('hashchange', handleRouteChange)
    return () => window.removeEventListener('hashchange', handleRouteChange)
  }, [])

  const handleAuthenticated = () => {
    setAuthenticated(true)
    window.location.hash = '#home'
  }

  const handleLogout = () => {
    clearAccessToken()
    setAuthenticated(false)
    window.location.hash = '#home'
  }

  if (route === '#login') return <LoginPage onAuthenticated={handleAuthenticated} />
  if (route === '#register') return <RegisterPage onAuthenticated={handleAuthenticated} />

  return <HomePage authenticated={authenticated} onLogout={handleLogout} />
}
