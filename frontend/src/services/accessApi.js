import { apiGet, apiPostJson, apiPutJson, apiDelete } from './apiClient'

export const listManagedRoles = (search, page) =>
  apiGet(`/admin/access/roles?${new URLSearchParams({ search, page })}`)
export const listManagedPermissions = () => apiGet('/admin/access/permissions')
export const getManagedRole = (id) => apiGet(`/admin/access/roles/${id}`)
export const saveManagedRole = (role) =>
  role.id
    ? apiPutJson(`/admin/access/roles/${role.id}`, role)
    : apiPostJson('/admin/access/roles', role)
export const configureManagedRole = (id, permissions) =>
  apiPutJson(`/admin/access/roles/${id}/permissions`, { permissions })
export const deleteManagedRole = (id) => apiDelete(`/admin/access/roles/${id}`)
