import { apiGet, apiPostJson, apiPutJson, apiDelete } from './apiClient'

export const getOverview = () => apiGet('/admin/overview')
export const getRoles = () => apiGet('/admin/roles')
export const getUsers = (filters) =>
  apiGet(
    `/admin/users?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== ''))}`,
  )
export const updateUser = (id, data) => apiPutJson(`/admin/users/${id}`, data)
export const getCatalog = (type) => apiGet(`/admin/${type}`)
export const saveCatalog = (type, data) =>
  data.id
    ? apiPutJson(`/admin/${type}/${data.id}`, data)
    : apiPostJson(`/admin/${type}`, data)
export const deleteCatalog = (type, id) => apiDelete(`/admin/${type}/${id}`)
