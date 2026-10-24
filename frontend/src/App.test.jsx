import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { login } from './services/authApi'

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <button type="button">Continue with Google</button>,
}))

vi.mock('./services/authApi', async () => {
  const actual = await vi.importActual('./services/authApi')
  return {
    ...actual,
    login: vi.fn(),
  }
})

describe('App authentication navigation', () => {
  beforeEach(() => {
    window.location.hash = ''
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('opens the home page first and exposes login and registration actions', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /Kho tài liệu học tập/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '#login')
    expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute('href', '#register')
  })

  it('returns home after login and allows the user to log out', async () => {
    login.mockResolvedValue({
      code: 1000,
      result: { token: 'session-jwt', authenticated: true },
    })
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'Đăng nhập' }))
    await screen.findByRole('heading', { name: 'Chào mừng bạn quay lại!' })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'student@university.edu.vn' },
    })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), {
      target: { value: 'Password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await screen.findByRole('heading', { name: /Kho tài liệu học tập/i })
    expect(sessionStorage.getItem('edushare.accessToken')).toBeNull()
    expect(screen.getByText('Tài khoản')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    await waitFor(() => expect(sessionStorage.getItem('edushare.accessToken')).toBeNull())
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument()
  })
})
