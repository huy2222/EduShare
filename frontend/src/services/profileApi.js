import { apiGet, apiPutJson } from './apiClient'

export function getMyProfile() {
  return apiGet('/users/me/profile')
}

export function updateMyProfile(profile) {
  return apiPutJson('/users/me/profile', profile)
}
