import React, { useState } from 'react'
import BrandMark from '../components/BrandMark'
import AccountLinkModal from '../components/AccountLinkModal'
import Divider from '../components/Divider'
import FormField from '../components/FormField'
import GoogleAuthButton from '../components/GoogleAuthButton'
import OtpVerificationPage from './OtpVerificationPage'
import arrowRight from '../assets/arrow-right.svg'
import eye from '../assets/eye.svg'
import lock from '../assets/lock.svg'
import mail from '../assets/mail.svg'
import {
  login,
  loginWithGoogle,
  resendVerificationCode,
  verifyEmail,
} from '../services/authApi'

export default function LoginPage({ onAuthenticated }) {
  const [showPassword, setShowPassword] = useState(false)
  const [linkToken, setLinkToken] = useState(null)
  const [googleError, setGoogleError] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')

  const completeLogin = () => {
    setGoogleError('')
    setFormError('')
    setLinkToken(null)
    setAuthenticated(true)
    if (onAuthenticated) {
      onAuthenticated()
    } else {
      window.location.hash = '#home'
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setAuthenticated(false)
    setSubmitting(true)
    try {
      const response = await login(email.trim(), password)
      if (response.result?.authenticated) completeLogin()
    } catch (error) {
      if (error.code === 1015) {
        setNeedsVerification(true)
        setFormError('')
      } else if (error.code === 1005 || error.code === 1006) {
        setFormError('Email hoặc mật khẩu không chính xác.')
      } else {
        setFormError(error.message || 'Không thể đăng nhập. Vui lòng thử lại.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyEmail = async (verificationCode) => {
    setFormError('')
    setVerificationMessage('')
    setSubmitting(true)
    try {
      await verifyEmail(email.trim(), verificationCode)
      const response = await login(email.trim(), password)
      if (response.result?.authenticated) completeLogin()
      setNeedsVerification(false)
    } catch (error) {
      setFormError(error.message || 'Không thể xác thực email. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setFormError('')
    setVerificationMessage('')
    setSubmitting(true)
    try {
      await resendVerificationCode(email.trim())
      setVerificationMessage('Mã OTP mới đã được gửi tới email của bạn.')
      return true
    } catch (error) {
      setFormError(error.message || 'Không thể gửi lại mã OTP.')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleCredential = async ({ credential }) => {
    setGoogleError('')
    try {
      const response = await loginWithGoogle(credential)
      if (response.result?.authenticated) {
        completeLogin()
        return
      }
      if (response.code === 1023 || response.result?.accountLinkRequired) {
        setLinkToken(response.result.linkToken)
        return
      }
      setGoogleError(response.message || 'Không thể đăng nhập bằng Google.')
    } catch (error) {
      setGoogleError(error.message || 'Không thể đăng nhập bằng Google.')
    }
  }

  if (needsVerification) {
    return (
      <OtpVerificationPage
        email={email}
        onVerify={handleVerifyEmail}
        onResend={handleResendOtp}
        onBack={() => {
          setNeedsVerification(false)
          setFormError('')
          setVerificationMessage('')
        }}
        submitting={submitting}
        error={formError}
        message={verificationMessage}
      />
    )
  }

  return (
    <main className="login-page">
      <div className="login-page__glow" aria-hidden="true" />

      <section className="login-card" aria-labelledby="login-title">
        <header className="login-card__header">
          <BrandMark />
          <h1 id="login-title">Chào mừng bạn quay lại!</h1>
          <p>Đăng nhập để tiếp tục khám phá tài liệu đại học</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <FormField
            id="identifier"
            label="Email"
            type="email"
            placeholder="sinhvien@university.edu.vn"
            icon={mail}
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={320}
          />

          <FormField
            id="password"
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={lock}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            maxLength={72}
            action={
              <a href="#forgot-password" className="text-link">
                Quên mật khẩu?
              </a>
            }
            trailingAction={
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <img src={eye} alt="" width="19" height="13" />
              </button>
            }
          />

          <div className="login-form__submit-wrap">
            <button className="primary-button" type="submit" disabled={submitting}>
              <span>{submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</span>
              <img src={arrowRight} alt="" width="12" height="12" />
            </button>
          </div>

          {formError && <p className="auth-message auth-message--error" role="alert">{formError}</p>}
        </form>

        <Divider>Hoặc tiếp tục với</Divider>

        <GoogleAuthButton
          onSuccess={handleGoogleCredential}
          onError={() => setGoogleError('Google không thể hoàn tất đăng nhập. Vui lòng thử lại.')}
        />

        {googleError && <p className="auth-message auth-message--error" role="alert">{googleError}</p>}
        {authenticated && (
          <p className="auth-message auth-message--success" role="status">
            Đăng nhập thành công.
          </p>
        )}

        <p className="signup-copy">
          Chưa có tài khoản?{' '}
          <a href="#register">Đăng ký ngay</a>
        </p>
      </section>

      {linkToken && (
        <AccountLinkModal
          linkToken={linkToken}
          onCancel={() => setLinkToken(null)}
          onLinked={completeLogin}
        />
      )}
    </main>
  )
}
