const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

async function post(path, body) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Không thể gọi API ${API_BASE_URL}${path}`, error)
    }
    throw new ApiError('Không thể kết nối tới máy chủ. Vui lòng thử lại.', undefined, 0)
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(payload.message || 'Yêu cầu không thành công.', payload.code, response.status)
  }
  return payload
}

export function login(email, password) {
  return post('/auth/token', { email, password })
}

export function register(fullName, email, password) {
  return post('/auth/register', { fullName, email, password })
}

export function verifyEmail(email, otp) {
  return post('/auth/verify-email', { email, otp })
}

export function resendVerificationCode(email) {
  return post('/auth/resend-otp', { email })
}

export function loginWithGoogle(idToken) {
  return post('/auth/google', { idToken })
}

export function linkGoogleAccount(linkToken, password) {
  return post('/auth/google/link', { linkToken, password })
}

export function saveAccessToken(token, remember = true) {
  const selectedStorage = remember ? localStorage : sessionStorage
  const otherStorage = remember ? sessionStorage : localStorage
  otherStorage.removeItem('edushare.accessToken')
  selectedStorage.setItem('edushare.accessToken', token)
}

export function getAccessToken() {
  return localStorage.getItem('edushare.accessToken')
    || sessionStorage.getItem('edushare.accessToken')
}

export function clearAccessToken() {
  localStorage.removeItem('edushare.accessToken')
  sessionStorage.removeItem('edushare.accessToken')
}
