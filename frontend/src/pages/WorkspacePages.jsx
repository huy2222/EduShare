import { useMemo, useState } from 'react'
import { ProfileIcon, ProfileShell } from './ProfilePages'
import '../styles/workspace.css'

const downloadItems = [
  { type: 'PDF', tone: 'red', title: 'Giáo trình Lập trình Web nâng cao - ReactJS & NodeJS', subject: 'Công nghệ thông tin', size: '15.4 MB', time: 'Đã tải 2 giờ trước' },
  { type: 'DOC', tone: 'blue', title: 'Đề thi cuối kỳ Toán cao cấp A1 (Có lời giải chi tiết)', subject: 'Toán học', size: '2.1 MB', time: 'Đã tải Hôm qua' },
  { type: 'ZIP', tone: 'sky', title: 'Source code bài tập lớn Cơ sở dữ liệu - Quản lý thư viện', subject: 'Công nghệ thông tin', size: '48.5 MB', time: 'Đã tải 3 ngày trước' },
  { type: 'PDF', tone: 'red', title: 'Slide bài giảng Kinh tế chính trị Mác - Lênin (Chương 1 đến 5)', subject: 'Triết học', size: '8.2 MB', time: 'Đã tải 5 ngày trước' },
]

const initialNotifications = [
  { id: 1, type: 'approved', icon: 'check', title: 'Tài liệu đã được phê duyệt', time: '10 phút trước', unread: true, text: <>Tài liệu “Giáo trình Giải tích 1 - ĐHBK” của bạn đã được kiểm duyệt thành công và hiện đã công khai trên hệ thống.</>, action: 'Xem tài liệu', actionTone: 'blue' },
  { id: 2, type: 'comment', icon: 'comment', title: 'Bình luận mới trong bài viết', time: '1 giờ trước', unread: true, text: <><strong>Nguyễn Văn A</strong> đã để lại một bình luận trên tài liệu <strong>“Đề thi thử Cấu trúc dữ liệu và Giải thuật”</strong>: “Cảm ơn bạn nhiều lắm, tài liệu rất hữu ích cho kỳ thi sắp tới!”</>, action: 'Xem bình luận', actionTone: 'gray' },
  { id: 3, type: 'warning', icon: 'alert', title: 'Tài liệu cần chỉnh sửa', time: '3 giờ trước', unread: true, text: <>Tài liệu “Báo cáo Thực tập cơ sở” chưa được duyệt do chất lượng ảnh chụp scan chưa rõ nét. Vui lòng cập nhật lại file PDF.</>, action: 'Chỉnh sửa ngay', actionTone: 'red' },
  { id: 4, type: 'mention', icon: 'at', title: 'Bạn được nhắc đến trong một phản hồi', time: 'Hôm qua', unread: false, text: <><strong>Trần Thị B</strong> đã nhắc đến bạn trong một thảo luận tại môn <strong>Vật lý đại cương 2</strong>: “@Student bạn có tài liệu chương 3 phần<br />từ trường không cho mình xin với.”</>, action: 'Xem phản hồi', actionTone: 'gray' },
  { id: 5, type: 'update', icon: 'bookmark', title: 'Cập nhật tài liệu môn học quan tâm', time: '2 ngày trước', unread: false, text: <>Môn học “Lập trình hướng đối tượng (IT1030)” bạn đang theo dõi vừa có 5 tài liệu ôn thi học kỳ mới được tải lên.</>, action: 'Khám phá môn học', actionTone: 'gray' },
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
  const [notifications, setNotifications] = useState(initialNotifications)
  const unreadCount = notifications.filter((notification) => notification.unread).length

  const visibleNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((notification) => notification.unread)
    if (filter === 'read') return notifications.filter((notification) => !notification.unread)
    return notifications
  }, [filter, notifications])

  const markAsRead = (id) => {
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, unread: false } : notification))
  }

  return (
    <ProfileShell activeSidebar="notifications" authenticated={authenticated} onLogout={onLogout}>
      <div className="notifications-heading">
        <div><h1>Thông báo</h1>{unreadCount > 0 && <span>{unreadCount} chưa đọc</span>}</div>
        <button onClick={() => setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })))} type="button"><WorkspaceIcon name="doubleCheck" size={17} /> Đánh dấu tất cả là đã đọc</button>
      </div>

      <div className="notification-tabs" role="tablist" aria-label="Bộ lọc thông báo">
        <button className={filter === 'all' ? 'notification-tabs__active' : ''} onClick={() => setFilter('all')} role="tab" type="button">Tất cả ({notifications.length})</button>
        <button className={filter === 'unread' ? 'notification-tabs__active' : ''} onClick={() => setFilter('unread')} role="tab" type="button">Chưa đọc ({unreadCount})</button>
        <button className={filter === 'read' ? 'notification-tabs__active' : ''} onClick={() => setFilter('read')} role="tab" type="button">Đã đọc ({notifications.length - unreadCount})</button>
      </div>

      <section className="notification-list" aria-live="polite">
        {visibleNotifications.map((notification) => (
          <article className={`notification-item notification-item--${notification.type}${notification.unread ? ' notification-item--unread' : ''}`} key={notification.id}>
            <span className="notification-item__icon"><WorkspaceIcon name={notification.icon} size={21} /></span>
            <div>
              <header><h2>{notification.title}</h2><time>{notification.time}</time>{notification.unread && <i aria-label="Chưa đọc" />}</header>
              <p>{notification.text}</p>
              <footer><button className={`notification-action notification-action--${notification.actionTone}`} type="button">{notification.action}</button>{notification.unread && <button onClick={() => markAsRead(notification.id)} type="button">Đánh dấu đã đọc</button>}</footer>
            </div>
          </article>
        ))}
        {visibleNotifications.length === 0 && <div className="notification-empty">Không có thông báo trong mục này.</div>}
      </section>
    </ProfileShell>
  )
}
