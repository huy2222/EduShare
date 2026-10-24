import React, { useState } from 'react'
import { linkGoogleAccount } from '../services/authApi'

export default function AccountLinkModal({ linkToken, onCancel, onLinked }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await linkGoogleAccount(linkToken, password)
      onLinked()
    } catch (requestError) {
      setError(
        requestError.code === 1031
          ? 'Mật khẩu không chính xác.'
          : requestError.message || 'Không thể liên kết tài khoản Google.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="account-link-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-link-title"
      >
        <h2 id="account-link-title">Liên kết tài khoản Google</h2>
        <p>
          Email này đã được sử dụng để tạo tài khoản EduShare. Hãy nhập mật khẩu
          EduShare hiện tại để xác nhận rằng bạn là chủ sở hữu tài khoản. Sau khi
          liên kết, bạn có thể đăng nhập bằng cả mật khẩu và Google.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="link-password">Mật khẩu EduShare</label>
          <input
            id="link-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            autoFocus
          />
          {error && <p className="modal-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onCancel} disabled={submitting}>
              Hủy
            </button>
            <button className="primary-button" type="submit" disabled={submitting || !password}>
              {submitting ? 'Đang liên kết…' : 'Liên kết Google'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
