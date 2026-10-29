import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HomeHeader } from './HomePage'
import '../styles/recovery.css'

function RecoveryIcon({ name, size = 20 }) {
  const paths = {
    reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><rect x="9" y="10" width="7" height="6" rx="1" /><path d="M11 10V8.8a1.5 1.5 0 0 1 3 0V10" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    arrowRight: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    arrowLeft: <><path d="M19 12H5" /><path d="m10 17-5-5 5-5" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {paths[name]}
    </svg>
  )
}

function RecoveryShell({ authenticated, onLogout, children }) {
  const [searchInput, setSearchInput] = useState('')

  return (
    <div className="recovery-page">
      <HomeHeader
        activePage=""
        authenticated={authenticated}
        onLogout={onLogout}
        onSearchChange={(event) => setSearchInput(event.target.value)}
        onSearchSubmit={(event) => event.preventDefault()}
        searchInput={searchInput}
      />
      <main className="recovery-main">{children}</main>
      <footer className="recovery-footer">© 2024 EduShare Platform. All rights reserved.</footer>
    </div>
  )
}

function RecoveryCardHeader({ id, title, description }) {
  return (
    <header className="recovery-card__header">
      <span className="recovery-card__icon"><RecoveryIcon name="reset" size={25} /></span>
      <h1 id={id}>{title}</h1>
      <p>{description}</p>
    </header>
  )
}

export function ForgotPasswordPage({ authenticated = false, onLogout = () => {} }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    navigate('/reset-password')
  }

  return (
    <RecoveryShell authenticated={authenticated} onLogout={onLogout}>
      <section className="recovery-card recovery-card--forgot" aria-labelledby="forgot-password-title">
        <RecoveryCardHeader
          id="forgot-password-title"
          title="Khôi phục mật khẩu"
          description={<>Nhập email đăng ký của bạn để nhận mã xác<br />thực đặt lại mật khẩu</>}
        />

        <form className="recovery-form" onSubmit={handleSubmit}>
          <label className="recovery-field">
            <span>Email trường học</span>
            <span className="recovery-field__control">
              <RecoveryIcon name="mail" size={17} />
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@university.edu.vn"
                required
                type="email"
                value={email}
              />
            </span>
          </label>

          <button className="recovery-submit" type="submit">
            Gửi mã xác thực
            <RecoveryIcon name="arrowRight" size={17} />
          </button>
        </form>

        <Link className="recovery-back" to="/login">
          <RecoveryIcon name="arrowLeft" size={16} />
          Quay lại đăng nhập
        </Link>
      </section>
    </RecoveryShell>
  )
}

function PasswordField({ id, label, value, onChange, visible, onToggle, autoComplete }) {
  return (
    <label className="recovery-field" htmlFor={id}>
      <span>{label}</span>
      <span className="recovery-field__control recovery-field__control--password">
        <RecoveryIcon name="lock" size={17} />
        <input
          autoComplete={autoComplete}
          id={id}
          minLength="8"
          onChange={onChange}
          placeholder="••••••••"
          required
          type={visible ? 'text' : 'password'}
          value={value}
        />
        <button
          aria-label={visible ? `Ẩn ${label.toLocaleLowerCase('vi')}` : `Hiện ${label.toLocaleLowerCase('vi')}`}
          aria-pressed={visible}
          onClick={onToggle}
          type="button"
        >
          <RecoveryIcon name="eye" size={18} />
        </button>
      </span>
    </label>
  )
}

export function ResetPasswordPage({ authenticated = false, onLogout = () => {} }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  return (
    <RecoveryShell authenticated={authenticated} onLogout={onLogout}>
      <section className="recovery-card recovery-card--reset" aria-labelledby="reset-password-title">
        <RecoveryCardHeader
          id="reset-password-title"
          title="Đặt lại mật khẩu mới"
          description={<>Vui lòng nhập mật khẩu mới cho tài khoản của<br />bạn</>}
        />

        <form className="recovery-form" onSubmit={(event) => event.preventDefault()}>
          <PasswordField
            autoComplete="new-password"
            id="new-password"
            label="Mật khẩu mới"
            onChange={(event) => setPassword(event.target.value)}
            onToggle={() => setShowPassword((visible) => !visible)}
            value={password}
            visible={showPassword}
          />
          <PasswordField
            autoComplete="new-password"
            id="confirm-new-password"
            label="Xác nhận mật khẩu mới"
            onChange={(event) => setConfirmation(event.target.value)}
            onToggle={() => setShowConfirmation((visible) => !visible)}
            value={confirmation}
            visible={showConfirmation}
          />

          <div className="recovery-requirements">
            <p>Yêu cầu mật khẩu:</p>
            <ul>
              <li>Ít nhất 8 ký tự</li>
              <li>Có chữ cái viết hoa</li>
              <li>Có chữ số</li>
              <li>Có chứa ký tự đặc biệt</li>
            </ul>
          </div>

          <button className="recovery-submit" type="submit">
            Cập nhật mật khẩu
            <RecoveryIcon name="arrowRight" size={17} />
          </button>
        </form>

        <Link className="recovery-back" to="/login">
          <RecoveryIcon name="arrowLeft" size={16} />
          Quay lại đăng nhập
        </Link>
      </section>
    </RecoveryShell>
  )
}
