import { apiGet, apiPutJson } from './apiClient'

export const getNotifications = () => apiGet('/notifications')
export const getUnreadNotificationCount = () => apiGet('/notifications/unread-count')
export const markNotificationRead = (id) => apiPutJson(`/notifications/${id}/read`)
export const markAllNotificationsRead = () => apiPutJson('/notifications/read-all')

export function createNotificationSocket() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
  const url = new URL(`${apiBase}/ws/notifications`, window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return new WebSocket(url)
}
