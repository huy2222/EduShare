import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import {
  linkGoogleAccount,
  login,
  loginWithGoogle,
  register,
  verifyEmail,
} from '../services/authApi'

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button type="button" onClick={() => onSuccess({ credential: 'google-id-token' })}>
      Continue with Google
    </button>
  ),
}))

vi.mock('../services/authApi', async () => {
  const actual = await vi.importActual('../services/authApi')
  return {
    ...actual,
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    linkGoogleAccount: vi.fn(),
    register: vi.fn(),
    resendVerificationCode: vi.fn(),
    verifyEmail: vi.fn(),
  }
})

const renderWithRouter = (component) => render(<MemoryRouter>{component}</MemoryRouter>)

describe('LoginPage Google authentication', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('does not expose or store the EduShare JWT after a Google login', async () => {
    const onAuthenticated = vi.fn()
    loginWithGoogle.mockResolvedValue({
      code: 1000,
      result: { token: 'edushare-jwt', authenticated: true },
    })

    renderWithRouter(<LoginPage onAuthenticated={onAuthenticated} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce())
    expect(localStorage.getItem('edushare.accessToken')).toBeNull()
    expect(sessionStorage.getItem('edushare.accessToken')).toBeNull()
  })

  it('opens the link modal and links without requesting another Google login', async () => {
    loginWithGoogle.mockResolvedValue({
      code: 1023,
      result: {
        accountLinkRequired: true,
        authenticated: false,
        linkToken: 'short-lived-link-token',
      },
    })
    linkGoogleAccount.mockResolvedValue({
      code: 1000,
      result: { token: 'linked-jwt', authenticated: true },
    })

    renderWithRouter(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
    const password = await screen.findByLabelText('Mật khẩu EduShare')
    fireEvent.change(password, { target: { value: 'Password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Liên kết Google' }))

    await waitFor(() => expect(linkGoogleAccount)
      .toHaveBeenCalledWith('short-lived-link-token', 'Password123'))
    expect(loginWithGoogle).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('edushare.accessToken')).toBeNull()
    expect(sessionStorage.getItem('edushare.accessToken')).toBeNull()
  })

  it('shows the explicit invalid-password message', async () => {
    loginWithGoogle.mockResolvedValue({
      code: 1023,
      result: { accountLinkRequired: true, linkToken: 'link-token' },
    })
    linkGoogleAccount.mockRejectedValue({ code: 1031, message: 'Invalid password' })

    renderWithRouter(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
    fireEvent.change(await screen.findByLabelText('Mật khẩu EduShare'), {
      target: { value: 'wrong-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Liên kết Google' }))

    expect(await screen.findByText('Mật khẩu không chính xác.')).toBeInTheDocument()
  })

  it('logs in with email without writing the JWT to browser storage', async () => {
    const onAuthenticated = vi.fn()
    login.mockResolvedValue({
      code: 1000,
      result: { token: 'password-jwt', authenticated: true },
    })

    renderWithRouter(<LoginPage onAuthenticated={onAuthenticated} />)
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'student@university.edu.vn' },
    })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), {
      target: { value: 'Password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => expect(login)
      .toHaveBeenCalledWith('student@university.edu.vn', 'Password123'))
    expect(sessionStorage.getItem('edushare.accessToken')).toBeNull()
    expect(localStorage.getItem('edushare.accessToken')).toBeNull()
    expect(onAuthenticated).toHaveBeenCalledOnce()
  })

  it('registers and verifies a new account with the emailed OTP', async () => {
    const onAuthenticated = vi.fn()
    register.mockResolvedValue({
      code: 1000,
      result: { email: 'student@university.edu.vn', status: 'PENDING_VERIFICATION' },
    })
    verifyEmail.mockResolvedValue({ code: 1000, message: 'Email verified successfully' })
    login.mockResolvedValue({
      code: 1000,
      result: { token: 'registered-user-jwt', authenticated: true },
    })

    renderWithRouter(<RegisterPage onAuthenticated={onAuthenticated} />)
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyễn Văn A' } })
    fireEvent.change(screen.getByLabelText('Email sinh viên'), {
      target: { value: 'student@university.edu.vn' },
    })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'Password123' } })
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), {
      target: { value: 'Password123' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))

    await waitFor(() => expect(register).toHaveBeenCalledWith(
      'Nguyễn Văn A',
      'student@university.edu.vn',
      'Password123',
    ))
    fireEvent.change(screen.getByLabelText('Mã xác thực email'), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Xác thực email' }))

    await waitFor(() => expect(verifyEmail)
      .toHaveBeenCalledWith('student@university.edu.vn', '123456'))
    expect(login).toHaveBeenCalledWith('student@university.edu.vn', 'Password123')
    expect(localStorage.getItem('edushare.accessToken')).toBeNull()
    expect(sessionStorage.getItem('edushare.accessToken')).toBeNull()
    expect(onAuthenticated).toHaveBeenCalledOnce()
  })

  it('registers with Google without storing the returned JWT', async () => {
    const onAuthenticated = vi.fn()
    loginWithGoogle.mockResolvedValue({
      code: 1000,
      result: { token: 'google-register-jwt', authenticated: true },
    })

    renderWithRouter(<RegisterPage onAuthenticated={onAuthenticated} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

    await waitFor(() => expect(loginWithGoogle).toHaveBeenCalledWith('google-id-token'))
    expect(localStorage.getItem('edushare.accessToken')).toBeNull()
    expect(sessionStorage.getItem('edushare.accessToken')).toBeNull()
    expect(onAuthenticated).toHaveBeenCalledOnce()
  })
})
