import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { getCurrentUser, login, logout } from './services/authApi'

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <button type="button">Continue with Google</button>,
}))

vi.mock('./services/authApi', async () => {
  const actual = await vi.importActual('./services/authApi')
  return {
    ...actual,
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }
})

describe('App authentication navigation', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    getCurrentUser.mockRejectedValue(new Error('No active session'))
    logout.mockResolvedValue({ code: 1000 })
  })

  it('opens the home page first and exposes login and registration actions', () => {
    render(<MemoryRouter><App /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /Kho tài liệu học tập/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute('href', '/register')
  })

  it('returns home after login and allows the user to log out', async () => {
    login.mockResolvedValue({
      code: 1000,
      result: { token: 'session-jwt', authenticated: true },
    })
    render(<MemoryRouter><App /></MemoryRouter>)

    fireEvent.click(screen.getByRole('link', { name: 'Đăng nhập' }))
    await screen.findByRole('heading', { name: 'Chào mừng bạn quay lại!' })
    fireEvent.change(screen.getByLabelText('Email hoặc tài khoản'), {
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

  it.each(['/login', '/register'])(
    'restores an existing session instead of showing %s',
    async (initialEntry) => {
      getCurrentUser.mockResolvedValue({
        code: 1000,
        result: { email: 'student@university.edu.vn', roles: ['USER'] },
      })

      render(
        <MemoryRouter initialEntries={[initialEntry]}>
          <App />
        </MemoryRouter>,
      )

      expect(
        await screen.findByRole('heading', { name: /Kho tài liệu học tập/i }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Chào mừng bạn quay lại!' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Tạo tài khoản mới' }),
      ).not.toBeInTheDocument()
    },
  )
})
