import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UploadPage from './pages/UploadPage'
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordRecoveryPages'
import { EditProfilePage, ProfilePage } from './pages/ProfilePages'
import { DownloadHistoryPage, NotificationsPage } from './pages/WorkspacePages'
import { AccountSettingsPage, FavoriteDocumentsPage } from './pages/SettingsFavoritesPages'
import { getCurrentUser, logout } from './services/authApi'

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then(() => { if (active) setAuthenticated(true) })
      .catch(() => { if (active) setAuthenticated(false) })
    return () => { active = false }
  }, [])

  const handleAuthenticated = () => {
    setAuthenticated(true)
    navigate('/', { replace: true })
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // The local UI is cleared even if the network is unavailable. The
      // server-side logout endpoint remains idempotent on the next attempt.
    } finally {
      setAuthenticated(false)
      navigate('/', { replace: true })
    }
  }

  const sharedProps = { authenticated, onLogout: handleLogout }

  return (
    <Routes>
      <Route path="/" element={<HomePage {...sharedProps} />} />
      <Route path="/explore" element={<HomePage {...sharedProps} />} />
      <Route path="/subjects" element={<HomePage {...sharedProps} />} />
      <Route path="/login" element={<LoginPage onAuthenticated={handleAuthenticated} />} />
      <Route path="/register" element={<RegisterPage onAuthenticated={handleAuthenticated} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage {...sharedProps} />} />
      <Route path="/reset-password" element={<ResetPasswordPage {...sharedProps} />} />
      <Route path="/upload" element={<UploadPage {...sharedProps} />} />
      <Route path="/profile" element={<ProfilePage {...sharedProps} />} />
      <Route path="/profile/edit" element={<EditProfilePage {...sharedProps} />} />
      <Route path="/downloads" element={<DownloadHistoryPage {...sharedProps} />} />
      <Route path="/notifications" element={<NotificationsPage {...sharedProps} />} />
      <Route path="/settings" element={<AccountSettingsPage {...sharedProps} />} />
      <Route path="/favorites" element={<FavoriteDocumentsPage {...sharedProps} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
