import { Link } from 'react-router-dom'
import { useNotifications } from './NotificationProvider'

export default function NotificationBell({ className = 'home-notification' }) {
  const { unreadCount } = useNotifications()
  return (
    <Link className={className} to="/notifications" aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}>
      <svg aria-hidden="true" fill="none" height="19" viewBox="0 0 24 24" width="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
      {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </Link>
  )
}
