const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

let csrf = null

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(payload.message || 'Yêu cầu không thành công.', payload.code, response.status)
  }
  return payload
}

async function getCsrfToken() {
  if (csrf) return csrf

  let response
  try {
    response = await fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'include' })
  } catch (error) {
    throw new ApiError('Không thể kết nối tới máy chủ. Vui lòng thử lại.', undefined, 0)
  }
  const payload = await parseResponse(response)
  csrf = {
    token: payload.result.token,
    headerName: payload.result.headerName,
  }
  return csrf
}

async function post(path, body) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const csrfToken = await getCsrfToken()
    let response
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          [csrfToken.headerName]: csrfToken.token,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Không thể gọi API ${API_BASE_URL}${path}`, error)
      }
      throw new ApiError('Không thể kết nối tới máy chủ. Vui lòng thử lại.', undefined, 0)
    }

    if (response.status === 403 && attempt === 0) {
      csrf = null
      continue
    }
    return parseResponse(response)
  }

  throw new ApiError('Yêu cầu không thành công.', undefined, 403)
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

export async function getCurrentUser() {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' })
  } catch (error) {
    throw new ApiError('Không thể kết nối tới máy chủ. Vui lòng thử lại.', undefined, 0)
  }
  return parseResponse(response)
}

export async function logout() {
  try {
    return await post('/auth/logout')
  } finally {
    csrf = null
  }
}
