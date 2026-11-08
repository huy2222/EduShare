import { apiGet, apiGetBlob, apiPostJson, apiPutJson, apiDelete } from './apiClient'

export const getOverview = () => apiGet('/admin/overview')
export const getRoles = () => apiGet('/admin/roles')
export const getUsers = async (filters) => {
  const response = await apiGet(
    `/admin/users?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== ''))}`,
  )
  return {
    ...response,
    result: { ...response.result, content: response.result.items },
  }
}
export const updateUser = (id, data) => apiPutJson(`/admin/users/${id}`, data)
export const getCatalog = (type, filters = {}) =>
  apiGet(`/admin/${type}?${new URLSearchParams(filters)}`)
export const getCatalogDetail = (type, id) => apiGet(`/admin/${type}/${id}`)
export const saveCatalog = (type, data) =>
  data.id
    ? apiPutJson(`/admin/${type}/${data.id}`, data)
    : apiPostJson(`/admin/${type}`, data)
export const deleteCatalog = (type, id) => apiDelete(`/admin/${type}/${id}`)
export const getModerationDocuments = (page = 0, size = 20) =>
  apiGet(`/admin/documents?page=${page}&size=${size}`)
export const getModerationStats = () => apiGet('/admin/documents/stats')
export const getModerationDocument = (id) => apiGet(`/admin/documents/${id}`)
export const getModerationDocumentContent = (id) =>
  apiGetBlob(`/admin/documents/${id}/content`)
export const getModerationDocumentPreview = (id) =>
  apiGetBlob(`/admin/documents/${id}/preview`)
export const moderateDocument = (id, action, reason = '') =>
  apiPostJson(`/admin/documents/${id}/moderate`, { action, reason })
