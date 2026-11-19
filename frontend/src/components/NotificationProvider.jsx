import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  createNotificationSocket,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationApi'

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: '',
  loadNotifications: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
})

export function NotificationProvider({ authenticated, children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const reconnectTimer = useRef(null)

  const loadNotifications = useCallback(async () => {
    if (!authenticated) return
    setLoading(true)
    setError('')
    try {
      const response = await getNotifications()
      setNotifications(response.result || [])
      setUnreadCount((response.result || []).filter((item) => !item.read).length)
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải thông báo.')
    } finally {
      setLoading(false)
    }
  }, [authenticated])

  useEffect(() => {
    if (!authenticated) {
      setNotifications([])
      setUnreadCount(0)
      return undefined
    }

    let stopped = false
    let socket
    getUnreadNotificationCount()
      .then((response) => setUnreadCount(response.result?.count || 0))
      .catch(() => {})

    const connect = () => {
      if (stopped) return
      socket = createNotificationSocket()
      socket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)
          setNotifications((current) => [
            notification,
            ...current.filter((item) => item.id !== notification.id),
          ])
          if (!notification.read) setUnreadCount((count) => count + 1)
        } catch {
          // Ignore malformed messages; persisted data is still available via REST.
        }
      }
      socket.onclose = () => {
        if (!stopped) reconnectTimer.current = window.setTimeout(connect, 3000)
      }
    }
    connect()

    return () => {
      stopped = true
      window.clearTimeout(reconnectTimer.current)
      socket?.close()
    }
  }, [authenticated])

  const markRead = useCallback(async (id) => {
    const existing = notifications.find((item) => item.id === id)
    if (!existing || existing.read) return
    await markNotificationRead(id)
    setNotifications((current) => current.map((item) => (
      item.id === id ? { ...item, read: true } : item
    )))
    setUnreadCount((count) => Math.max(0, count - 1))
  }, [notifications])

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    setNotifications((current) => current.map((item) => ({ ...item, read: true })))
    setUnreadCount(0)
  }, [])

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markRead,
    markAllRead,
  }), [notifications, unreadCount, loading, error, loadNotifications, markRead, markAllRead])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => useContext(NotificationContext)
