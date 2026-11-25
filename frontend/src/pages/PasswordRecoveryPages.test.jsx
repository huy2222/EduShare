import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ForgotPasswordPage, PasswordResetOtpPage, ResetPasswordPage } from './PasswordRecoveryPages'
import { requestPasswordReset, resetPassword, verifyPasswordResetOtp } from '../services/authApi'

vi.mock('../services/authApi', () => ({
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  verifyPasswordResetOtp: vi.fn(),
}))

describe('Password recovery pages', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requests a reset code and carries the email to the reset page', async () => {
    requestPasswordReset.mockResolvedValue({ code: 1000 })

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Email trường học'), {
      target: { value: 'student@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Gửi mã xác thực/i }))

    await waitFor(() => expect(requestPasswordReset)
      .toHaveBeenCalledWith('student@example.com'))
  })

  it('verifies the emailed OTP before showing the password form', async () => {
    verifyPasswordResetOtp.mockResolvedValue({ code: 1000 })

    render(
      <MemoryRouter initialEntries={['/reset-password/otp?email=student%40example.com']}>
        <PasswordResetOtpPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Mã xác thực email'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác thực email' }))

    await waitFor(() => expect(verifyPasswordResetOtp).toHaveBeenCalledWith(
      'student@example.com',
      '123456',
    ))
  })

  it('resets the password only after OTP verification', async () => {
    resetPassword.mockResolvedValue({ code: 1000 })

    render(
      <MemoryRouter initialEntries={['/reset-password?email=student%40example.com']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'NewPassword1!' } })
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), {
      target: { value: 'NewPassword1!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Cập nhật mật khẩu/i }))

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith(
      'student@example.com',
      'NewPassword1!',
    ))
  })
})
