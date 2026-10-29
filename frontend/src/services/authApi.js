import {
  ApiError,
  apiGet,
  apiPostJson,
  clearCsrfToken,
} from './apiClient'

export { ApiError }

export function login(email, password) {
  return apiPostJson('/auth/token', { email, password })
}

export function register(fullName, email, password) {
  return apiPostJson('/auth/register', { fullName, email, password })
}

export function verifyEmail(email, otp) {
  return apiPostJson('/auth/verify-email', { email, otp })
}

export function resendVerificationCode(email) {
  return apiPostJson('/auth/resend-otp', { email })
}

export function loginWithGoogle(idToken) {
  return apiPostJson('/auth/google', { idToken })
}

export function linkGoogleAccount(linkToken, password) {
  return apiPostJson('/auth/google/link', { linkToken, password })
}

export async function getCurrentUser() {
  return apiGet('/users/me')
}

export async function logout() {
  try {
    return await apiPostJson('/auth/logout')
  } finally {
    clearCsrfToken()
  }
}
