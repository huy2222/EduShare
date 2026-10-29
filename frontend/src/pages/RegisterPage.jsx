import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AccountLinkModal from '../components/AccountLinkModal'
import BrandMark from '../components/BrandMark'
import Divider from '../components/Divider'
import FormField from '../components/FormField'
import GoogleAuthButton from '../components/GoogleAuthButton'
import OtpVerificationPage from './OtpVerificationPage'
import arrowRight from '../assets/arrow-right.svg'
import eye from '../assets/eye.svg'
import lock from '../assets/lock.svg'
import mail from '../assets/mail.svg'
import confirmPassword from '../assets/register/confirm-password.svg'
import user from '../assets/register/user.svg'
import {
  login,
  loginWithGoogle,
  register,
  resendVerificationCode,
  verifyEmail,
} from '../services/authApi'

function PasswordToggle({ visible, onToggle, label }) {
  return (
    <button
      className="password-toggle"
      type="button"
      aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label}`}
      aria-pressed={visible}
      onClick={onToggle}
    >
      <img src={eye} alt="" width="18.333" height="12.5" />
    </button>
  )
}

export default function RegisterPage({ onAuthenticated }) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [awaitingVerification, setAwaitingVerification] = useState(false)
  const [verified, setVerified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [googleError, setGoogleError] = useState('')
  const [googleAuthenticated, setGoogleAuthenticated] = useState(false)
  const [linkToken, setLinkToken] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password !== passwordConfirmation) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (!acceptedTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.')
      return
    }

    setSubmitting(true)
    try {
      await register(fullName.trim(), email.trim(), password)
      setAwaitingVerification(true)
      setMessage('')
    } catch (requestError) {
      setError(
        requestError.code === 1002
          ? 'Email này đã được đăng ký.'
          : requestError.message || 'Không thể đăng ký. Vui lòng thử lại.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (verificationCode) => {
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      await verifyEmail(email.trim(), verificationCode)
      await login(email.trim(), password)
      completeGoogleRegistration()
    } catch (requestError) {
      setError(requestError.message || 'Không thể xác thực email. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      await resendVerificationCode(email.trim())
      setMessage('Mã OTP mới đã được gửi tới email của bạn.')
      return true
    } catch (requestError) {
      setError(requestError.message || 'Không thể gửi lại mã OTP.')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const completeGoogleRegistration = () => {
    setGoogleAuthenticated(true)
    setGoogleError('')
    setLinkToken(null)
    if (onAuthenticated) {
      onAuthenticated()
    } else {
      navigate('/', { replace: true })
    }
  }

  const handleGoogleCredential = async ({ credential }) => {
    setGoogleError('')
    setGoogleAuthenticated(false)
    try {
      const response = await loginWithGoogle(credential)
      if (response.result?.authenticated) {
        completeGoogleRegistration()
        return
      }
      if (response.code === 1023 || response.result?.accountLinkRequired) {
        setLinkToken(response.result.linkToken)
        return
      }
      setGoogleError(response.message || 'Không thể đăng ký bằng Google.')
    } catch (requestError) {
      setGoogleError(requestError.message || 'Không thể đăng ký bằng Google.')
    }
  }

  if (awaitingVerification) {
    return (
      <OtpVerificationPage
        email={email}
        onVerify={handleVerify}
        onResend={handleResend}
        onBack={() => navigate('/login')}
        submitting={submitting}
        error={error}
        message={message}
      />
    )
  }

  return (
    <main className="register-page">
      <div className="register-page__stage">
        <section className="register-card" aria-labelledby="register-title">
          <span className="register-card__blob register-card__blob--top" aria-hidden="true" />
          <span className="register-card__blob register-card__blob--bottom" aria-hidden="true" />

          <header className="register-card__header">
            <BrandMark />
            <h1 id="register-title">Tạo tài khoản EduShare</h1>
            <p>Tham gia cộng đồng chia sẻ tài liệu hàng đầu</p>
          </header>

          <form className="register-form" onSubmit={handleSubmit}>
            <FormField
              id="full-name"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              icon={user}
              autoComplete="name"
              className="form-field--name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              maxLength={100}
              disabled={awaitingVerification || verified}
            />

            <FormField
              id="student-email"
              label="Email sinh viên"
              type="email"
              placeholder="hovaten@student.edu.vn"
              icon={mail}
              helperText="Vui lòng sử dụng email có đuôi .edu.vn"
              autoComplete="email"
              className="form-field--email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={320}
              disabled={awaitingVerification || verified}
            />

            <FormField
              id="new-password"
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ít nhất 8 ký tự"
              icon={lock}
              autoComplete="new-password"
              className="form-field--password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              maxLength={72}
              disabled={awaitingVerification || verified}
              trailingAction={
                <PasswordToggle
                  visible={showPassword}
                  label="mật khẩu"
                  onToggle={() => setShowPassword((visible) => !visible)}
                />
              }
            />

            <FormField
              id="confirm-password"
              label="Xác nhận mật khẩu"
              type={showConfirmation ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu"
              icon={confirmPassword}
              autoComplete="new-password"
              className="form-field--confirmation"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              required
              minLength={8}
              maxLength={72}
              disabled={awaitingVerification || verified}
              trailingAction={
                <PasswordToggle
                  visible={showConfirmation}
                  label="mật khẩu xác nhận"
                  onToggle={() => setShowConfirmation((visible) => !visible)}
                />
              }
            />

            <label className="terms-option">
              <input
                type="checkbox"
                name="terms"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                disabled={awaitingVerification || verified}
              />
              <span>
                Tôi đồng ý với các <Link to="/terms">Điều khoản dịch vụ</Link> và{' '}
                <Link to="/privacy">Chính sách bảo mật</Link> của EduShare.
              </span>
            </label>

            <div className="register-form__submit-wrap">
              <button className="primary-button" type="submit" disabled={submitting || awaitingVerification || verified}>
                <span>{submitting ? 'Đang xử lý…' : 'Đăng ký'}</span>
                <img src={arrowRight} alt="" width="12" height="12" />
              </button>
            </div>

            {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
            {message && <p className="auth-message auth-message--success" role="status">{message}</p>}

            <Divider>Hoặc tiếp tục với</Divider>

            <GoogleAuthButton
              onSuccess={handleGoogleCredential}
              onError={() => setGoogleError('Google không thể hoàn tất đăng ký. Vui lòng thử lại.')}
              text="signup_with"
            />

            {googleError && <p className="auth-message auth-message--error" role="alert">{googleError}</p>}
            {googleAuthenticated && (
              <p className="auth-message auth-message--success" role="status">
                Đăng ký bằng Google thành công.
              </p>
            )}

            <p className="login-copy">
              {verified ? 'Email đã được xác thực. ' : 'Đã có tài khoản? '}
              <Link to="/login">Đăng nhập</Link>
            </p>
          </form>
        </section>
      </div>

      {linkToken && (
        <AccountLinkModal
          linkToken={linkToken}
          onCancel={() => setLinkToken(null)}
          onLinked={completeGoogleRegistration}
        />
      )}
    </main>
  )
}
