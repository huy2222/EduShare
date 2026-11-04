import { apiGet, apiPostJson, apiPutJson, apiDelete } from './apiClient'

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
