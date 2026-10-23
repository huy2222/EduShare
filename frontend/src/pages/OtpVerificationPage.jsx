import { useEffect, useState } from 'react'
import OtpCodeInput from '../components/OtpCodeInput'
import arrowRight from '../assets/arrow-right.svg'
import arrowLeft from '../assets/otp/arrow-left.svg'
import clock from '../assets/otp/clock.svg'
import verificationMail from '../assets/otp/verification-mail.svg'

function maskEmail(email) {
  const [localPart = '', domain = ''] = email.split('@')
  if (!domain) return email
  const visiblePart = localPart.slice(0, Math.min(2, localPart.length))
  return `${visiblePart}***@${domain}`
}

export default function OtpVerificationPage({
  email,
  onVerify,
  onResend,
  onBack,
  submitting = false,
  error = '',
  message = '',
}) {
  const [otp, setOtp] = useState('')
  const [secondsRemaining, setSecondsRemaining] = useState(59)

  useEffect(() => {
    if (secondsRemaining <= 0) return undefined
    const timer = window.setTimeout(() => {
      setSecondsRemaining((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [secondsRemaining])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (otp.length === 6 && !submitting) onVerify(otp)
  }

  const handleResend = async () => {
    if (secondsRemaining > 0 || submitting) return
    const resent = await onResend()
    if (resent !== false) setSecondsRemaining(59)
  }

  return (
    <main className="otp-page">
      <div className="otp-shell">
        <span className="otp-shell__blob otp-shell__blob--top" aria-hidden="true" />
        <span className="otp-shell__blob otp-shell__blob--bottom" aria-hidden="true" />

        <form className="otp-card" onSubmit={handleSubmit} aria-labelledby="otp-title">
          <div className="otp-card__icon" aria-hidden="true">
            <img src={verificationMail} alt="" width="28" height="24" />
          </div>

          <h1 id="otp-title">Xác thực mã OTP</h1>
          <p className="otp-card__description">
            Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến email{' '}
            <strong>{maskEmail(email)}</strong>
          </p>

          <OtpCodeInput value={otp} onChange={setOtp} disabled={submitting} />

          <div className="otp-timer" aria-live="polite">
            <img src={clock} alt="" width="15" height="15" />
            {secondsRemaining > 0 ? (
              <span>Gửi lại mã sau <strong>{secondsRemaining}s</strong></span>
            ) : (
              <button type="button" onClick={handleResend} disabled={submitting}>Gửi lại mã</button>
            )}
          </div>

          {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
          {message && <p className="auth-message auth-message--success" role="status">{message}</p>}

          <button
            className="otp-card__confirm"
            type="submit"
            aria-label="Xác thực email"
            disabled={submitting}
          >
            <span>{submitting ? 'Đang xác thực…' : 'Xác nhận'}</span>
            <img src={arrowRight} alt="" width="12" height="12" />
          </button>

          <button className="otp-card__back" type="button" onClick={onBack}>
            <img src={arrowLeft} alt="" width="12" height="12" />
            <span>Quay lại đăng nhập</span>
          </button>
        </form>
      </div>
    </main>
  )
}
