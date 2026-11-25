import { apiDelete, apiGet, apiPutJson } from './apiClient'

export function getSubjects(filters = {}, followedOnly = false) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => { if (value !== '' && value != null) params.set(key, value) })
  return apiGet(`/library/${followedOnly ? 'me/' : ''}subjects?${params}`, followedOnly ? undefined : { credentials: 'omit' })
}

export const getSubject = (id) => apiGet(`/library/subjects/${encodeURIComponent(id)}`, { credentials: 'omit' })
export const getFollowedSubjectIds = () => apiGet('/library/me/subject-follows')
export function setSubjectFollow(id, followed) {
  const path = `/library/me/subjects/${encodeURIComponent(id)}/follow`
  return followed ? apiPutJson(path, {}) : apiDelete(path)
}
