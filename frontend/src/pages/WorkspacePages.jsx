import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProfileIcon, ProfileShell } from './ProfilePages'
import { useNotifications } from '../components/NotificationProvider'
import '../styles/workspace.css'

const downloadItems = [
  { type: 'PDF', tone: 'red', title: 'Giáo trình Lập trình Web nâng cao - ReactJS & NodeJS', subject: 'Công nghệ thông tin', size: '15.4 MB', time: 'Đã tải 2 giờ trước' },
  { type: 'DOC', tone: 'blue', title: 'Đề thi cuối kỳ Toán cao cấp A1 (Có lời giải chi tiết)', subject: 'Toán học', size: '2.1 MB', time: 'Đã tải Hôm qua' },
  { type: 'ZIP', tone: 'sky', title: 'Source code bài tập lớn Cơ sở dữ liệu - Quản lý thư viện', subject: 'Công nghệ thông tin', size: '48.5 MB', time: 'Đã tải 3 ngày trước' },
  { type: 'PDF', tone: 'red', title: 'Slide bài giảng Kinh tế chính trị Mác - Lênin (Chương 1 đến 5)', subject: 'Triết học', size: '8.2 MB', time: 'Đã tải 5 ngày trước' },
]

function WorkspaceIcon({ name, size = 18 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    check: <path d="m7 12 3 3 7-7" />,
    comment: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></>,
    at: <><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />,
    doubleCheck: <><path d="m2 12 4 4L14 8" /><path d="m10 12 4 4 8-8" /></>,
  }

  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      {paths[name]}
    </svg>
  )
}

export function DownloadHistoryPage({ authenticated = false, onLogout = () => {} }) {
  const [query, setQuery] = useState('')
  const visibleDownloads = downloadItems.filter((item) => item.title.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')))

  return (
    <ProfileShell activeSidebar="downloads" authenticated={authenticated} onLogout={onLogout}>
      <div className="workspace-heading">
        <h1>Lịch sử tải xuống</h1>
        <p>Xem lại và quản lý các tài liệu học tập bạn đã tải về máy</p>
      </div>

      <section className="download-stats" aria-label="Thống kê tải xuống">
        <article><span><ProfileIcon name="download" size={24} /></span><div><small>Tổng tài liệu đã tải</small><strong>24</strong></div></article>
        <article><span><ProfileIcon name="folder" size={24} /></span><div><small>Dung lượng đã dùng</small><strong>128 MB</strong></div></article>
        <article><span><WorkspaceIcon name="clock" size={24} /></span><div><small>Lần tải gần nhất</small><strong>Hôm nay</strong></div></article>
      </section>

      <section className="download-card">
        <div className="download-toolbar">
          <label><WorkspaceIcon name="search" size={17} /><input onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong lịch sử tải..." type="search" value={query} /></label>
          <div><button type="button">Tất cả môn học</button><button type="button">Tất cả định dạng</button><button type="button">Mới nhất</button></div>
        </div>

        <div className="download-list">
          {visibleDownloads.map((item) => (
            <article key={item.title}>
              <span className={`download-file-type download-file-type--${item.tone}`}>{item.type}</span>
              <div><h2>{item.title}</h2><p><ProfileIcon name="graduation" size={13} /> {item.subject} <i>•</i> {item.size} <i>•</i> {item.time}</p></div>
              <div className="download-row-actions"><button type="button"><WorkspaceIcon name="eye" size={16} /> Xem tài liệu</button><button type="button"><ProfileIcon name="download" size={16} /> Tải lại</button></div>
            </article>
          ))}
          {visibleDownloads.length === 0 && <p className="download-empty">Không tìm thấy tài liệu phù hợp.</p>}
        </div>

        <footer className="download-pagination">
          <span>Hiển thị 1-4 trong số 24 tài liệu</span>
          <nav aria-label="Phân trang"><button type="button">Trang trước</button><button className="download-pagination__active" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">Trang sau</button></nav>
        </footer>
      </section>
    </ProfileShell>
  )
}

export function NotificationsPage({ authenticated = false, onLogout = () => {} }) {
  const [filter, setFilter] = useState('all')
  const [selectedNotificationId, setSelectedNotificationId] = useState(null)
  const navigate = useNavigate()
  const {
    notifications, unreadCount, loading, error,
    loadNotifications, markRead, markAllRead,
  } = useNotifications()

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const visibleNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((notification) => !notification.read)
    if (filter === 'read') return notifications.filter((notification) => notification.read)
    return notifications
  }, [filter, notifications])

  const selectedNotification = notifications.find(
    (notification) => notification.id === selectedNotificationId,
  ) || null

  const display = (notification) => {
    const pending = notification.type === 'DOCUMENT_PENDING_REVIEW'
    const rejected = ['DOCUMENT_REJECTED', 'DOCUMENT_REJECTED_VIRUS'].includes(notification.type)
    return {
      type: pending ? 'update' : rejected ? 'warning' : 'approved',
      icon: pending ? 'bookmark' : rejected ? 'alert' : 'check',
      action: pending ? 'Mở hàng chờ duyệt' : notification.type === 'DOCUMENT_APPROVED' ? 'Xem tài liệu' : null,
      actionTone: rejected ? 'red' : 'blue',
      target: pending ? '/admin/moderation' : notification.type === 'DOCUMENT_APPROVED' ? `/documents/${notification.documentId}` : null,
    }
  }

  const openDetail = (notification) => {
    setSelectedNotificationId(notification.id)
    if (!notification.read) markRead(notification.id)
  }

  return (
    <ProfileShell activeSidebar="notifications" authenticated={authenticated} onLogout={onLogout}>
      <div className="notifications-heading">
        <div><h1>Thông báo</h1>{unreadCount > 0 && <span>{unreadCount} chưa đọc</span>}</div>
        <button disabled={unreadCount === 0} onClick={() => markAllRead()} type="button"><WorkspaceIcon name="doubleCheck" size={17} /> Đánh dấu tất cả là đã đọc</button>
      </div>

      <div className="notification-tabs" role="tablist" aria-label="Bộ lọc thông báo">
        <button className={filter === 'all' ? 'notification-tabs__active' : ''} onClick={() => setFilter('all')} role="tab" type="button">Tất cả ({notifications.length})</button>
        <button className={filter === 'unread' ? 'notification-tabs__active' : ''} onClick={() => setFilter('unread')} role="tab" type="button">Chưa đọc ({unreadCount})</button>
        <button className={filter === 'read' ? 'notification-tabs__active' : ''} onClick={() => setFilter('read')} role="tab" type="button">Đã đọc ({notifications.length - unreadCount})</button>
      </div>

      <section className="notification-list" aria-live="polite">
        {loading && notifications.length === 0 && <div className="notification-empty">Đang tải thông báo…</div>}
        {!loading && error && <div className="notification-empty" role="alert">{error}</div>}
        {visibleNotifications.map((notification) => {
          const view = display(notification)
          return (
            <article
              aria-label={`Xem chi tiết: ${notification.title}`}
              className={`notification-item notification-item--${view.type}${!notification.read ? ' notification-item--unread' : ''}`}
              key={notification.id}
              onClick={() => openDetail(notification)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openDetail(notification)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span className="notification-item__icon"><WorkspaceIcon name={view.icon} size={21} /></span>
              <div>
                <header><h2>{notification.title}</h2><time>{formatNotificationTime(notification.createdAt)}</time>{!notification.read && <i aria-label="Chưa đọc" />}</header>
                <p>{notification.message}</p>
                <footer>{view.action && <button className={`notification-action notification-action--${view.actionTone}`} onClick={(event) => { event.stopPropagation(); markRead(notification.id); navigate(view.target) }} type="button">{view.action}</button>}{!notification.read && <button onClick={(event) => { event.stopPropagation(); markRead(notification.id) }} type="button">Đánh dấu đã đọc</button>}<button onClick={(event) => { event.stopPropagation(); openDetail(notification) }} type="button">Xem chi tiết</button></footer>
              </div>
            </article>
          )
        })}
        {!loading && !error && visibleNotifications.length === 0 && <div className="notification-empty">Không có thông báo trong mục này.</div>}
      </section>
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotificationId(null)}
          onNavigate={(target) => {
            setSelectedNotificationId(null)
            navigate(target)
          }}
          view={display(selectedNotification)}
        />
      )}
    </ProfileShell>
  )
}

function NotificationDetailModal({ notification, view, onClose, onNavigate }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
    return () => {
      if (!dialog) return
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [])

  return (
    <dialog
      aria-labelledby="notification-detail-title"
      className={`notification-detail notification-detail--${view.type}`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      ref={dialogRef}
    >
      <div className="notification-detail__panel">
        <header>
          <span className="notification-detail__icon"><WorkspaceIcon name={view.icon} size={24} /></span>
          <div>
            <small>CHI TIẾT THÔNG BÁO</small>
            <h2 id="notification-detail-title">{notification.title}</h2>
          </div>
          <button aria-label="Đóng chi tiết thông báo" className="notification-detail__close" onClick={onClose} type="button">×</button>
        </header>
        <div className="notification-detail__body">
          <p>{notification.message}</p>
          <dl>
            <div><dt>Thời gian</dt><dd>{formatNotificationDateTime(notification.createdAt)}</dd></div>
            <div><dt>Trạng thái</dt><dd>{notification.read ? 'Đã đọc' : 'Chưa đọc'}</dd></div>
          </dl>
        </div>
        <footer>
          <button className="notification-detail__secondary" onClick={onClose} type="button">Đóng</button>
          {view.action && <button className="notification-detail__primary" onClick={() => onNavigate(view.target)} type="button">{view.action}</button>}
        </footer>
      </div>
    </dialog>
  )
}

function formatNotificationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'Vừa xong'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function formatNotificationDateTime(value) {
  if (!value) return 'Không xác định'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Không xác định'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date)
}
