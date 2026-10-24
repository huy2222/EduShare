import { afterEach, describe, expect, it, vi } from 'vitest'
import { login, register } from './authApi'

describe('authApi development URLs', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the same-origin Vite proxy for login and registration', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          code: 1000,
          result: { token: 'csrf-token', headerName: 'X-XSRF-TOKEN' },
        }),
      })
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ code: 1000, result: {} }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await login('student@example.com', 'Password123')
    await register('Nguyen Van A', 'student@example.com', 'Password123')

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/csrf', {
      credentials: 'include',
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/token', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': 'csrf-token' },
      body: JSON.stringify({ email: 'student@example.com', password: 'Password123' }),
    })
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': 'csrf-token' },
      body: JSON.stringify({
        fullName: 'Nguyen Van A',
        email: 'student@example.com',
        password: 'Password123',
      }),
    })
  })
})
