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
  } catch {
    throw new ApiError('Không thể kết nối tới máy chủ. Vui lòng thử lại.', undefined, 0)
  }

  const payload = await parseResponse(response)
  csrf = {
    token: payload.result.token,
    headerName: payload.result.headerName,
  }
  return csrf
}

async function requestWithCsrf(path, buildOptions) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const csrfToken = await getCsrfToken()
    let response
    try {
      response = await fetch(`${API_BASE_URL}${path}`, buildOptions(csrfToken))
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

export async function apiGet(path) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include' })
  } catch {
    throw new ApiError('Không thể kết nối tới máy chủ. Vui lòng thử lại.', undefined, 0)
  }
  return parseResponse(response)
}

export function apiPostJson(path, body) {
  return requestWithCsrf(path, (csrfToken) => ({
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      [csrfToken.headerName]: csrfToken.token,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }))
}

export function apiPutJson(path, body) {
  return requestWithCsrf(path, (csrfToken) => ({
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      [csrfToken.headerName]: csrfToken.token,
    },
    body: JSON.stringify(body),
  }))
}

export function apiPostForm(path, formData) {
  return requestWithCsrf(path, (csrfToken) => ({
    method: 'POST',
    credentials: 'include',
    headers: { [csrfToken.headerName]: csrfToken.token },
    body: formData,
  }))
}

export function clearCsrfToken() {
  csrf = null
}
