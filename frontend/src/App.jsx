import { canEnterAdmin } from './services/adminAccess'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminPages from './pages/AdminPages'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UploadPage from './pages/UploadPage'
import {
  ForgotPasswordPage,
  ResetPasswordPage,
} from './pages/PasswordRecoveryPages'
import { EditProfilePage, ProfilePage } from './pages/ProfilePages'
import { DownloadHistoryPage, NotificationsPage } from './pages/WorkspacePages'
import {
  AccountSettingsPage,
  FavoriteDocumentsPage,
} from './pages/SettingsFavoritesPages'
import { getCurrentUser, logout } from './services/authApi'

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((response) => {
        if (active) {
          setAuthenticated(true)
          setCurrentUser(response.result)
        }
      })
      .catch(() => {
        if (active) setAuthenticated(false)
      })
      .finally(() => {
        if (active) setAuthLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleAuthenticated = async () => {
    setAuthenticated(true)
    try {
      const response = await getCurrentUser()
      setCurrentUser(response.result)
      navigate(canEnterAdmin(response.result) ? '/admin' : '/', {
        replace: true,
      })
    } catch {
      navigate('/', { replace: true })
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // The local UI is cleared even if the network is unavailable. The
      // server-side logout endpoint remains idempotent on the next attempt.
    } finally {
      setAuthenticated(false)
      setCurrentUser(null)
      navigate('/', { replace: true })
    }
  }

  const sharedProps = { authenticated, currentUser, onLogout: handleLogout }
  const authenticatedLandingPage = canEnterAdmin(currentUser) ? '/admin' : '/'
  const loginElement = authLoading
    ? null
    : authenticated
      ? <Navigate to={authenticatedLandingPage} replace />
      : <LoginPage onAuthenticated={handleAuthenticated} />
  const registerElement = authLoading
    ? null
    : authenticated
      ? <Navigate to={authenticatedLandingPage} replace />
      : <RegisterPage onAuthenticated={handleAuthenticated} />

  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <AdminPages
            currentUser={currentUser}
            authLoading={authLoading}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/admin/:section"
        element={
          <AdminPages
            currentUser={currentUser}
            authLoading={authLoading}
            onLogout={handleLogout}
          />
        }
      />
      <Route path="/" element={<HomePage {...sharedProps} />} />
      <Route path="/explore" element={<HomePage {...sharedProps} />} />
      <Route path="/subjects" element={<HomePage {...sharedProps} />} />
      <Route
        path="/login"
        element={loginElement}
      />
      <Route
        path="/register"
        element={registerElement}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage {...sharedProps} />}
      />
      <Route
        path="/reset-password"
        element={<ResetPasswordPage {...sharedProps} />}
      />
      <Route path="/upload" element={<UploadPage {...sharedProps} />} />
      <Route path="/profile" element={<ProfilePage {...sharedProps} />} />
      <Route
        path="/profile/edit"
        element={<EditProfilePage {...sharedProps} />}
      />
      <Route
        path="/downloads"
        element={<DownloadHistoryPage {...sharedProps} />}
      />
      <Route
        path="/notifications"
        element={<NotificationsPage {...sharedProps} />}
      />
      <Route
        path="/settings"
        element={<AccountSettingsPage {...sharedProps} />}
      />
      <Route
        path="/favorites"
        element={<FavoriteDocumentsPage {...sharedProps} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
