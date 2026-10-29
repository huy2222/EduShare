import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ProfileIcon, ProfileShell } from './ProfilePages'
import '../styles/settings-favorites.css'

const favoriteDocuments = [
  { id: 1, type: 'PDF', category: 'Giáo trình', code: 'MATH101', subject: 'Toán cao cấp A1', title: 'Tổng hợp lý thuyết & 500 bài tập giải tích 1 có lời giải chi tiết', description: 'Tài liệu tổng ôn kiến thức học phần Giải tích 1 bao gồm giới hạn, đạo hàm, tích phân và bài tập.', author: 'Nguyễn Văn A', initials: 'NV', rating: '4.9', downloads: '1.2k', size: '14.2 MB', pages: '124 trang', tone: 'blue' },
  { id: 2, type: 'DOCX', category: 'Đề thi / Ôn tập', code: 'CS202', subject: 'Cấu trúc dữ liệu & Giải thuật', title: 'Tuyển tập đề thi giữa kỳ và cuối kỳ môn Cấu trúc dữ liệu', description: 'Bộ đề thi có đáp án chi tiết các thuật toán sắp xếp, cây nhị phân tìm kiếm và đồ thị.', author: 'Trần Thị B', initials: 'TT', rating: '4.8', downloads: '2.5k', size: '4.8 MB', pages: '45 trang', tone: 'violet' },
  { id: 3, type: 'PPTX', category: 'Slide bài giảng', code: 'ECO301', subject: 'Kinh tế vi mô nâng cao', title: 'Slide bài giảng Kinh tế vi mô: Mô hình IS–LM và Chính sách', description: 'Hệ thống slide trực quan từ giảng viên Kinh tế Quốc dân, phân tích sâu các cân bằng thị trường.', author: 'Lê Hoàng Nam', initials: 'LH', rating: '4.7', downloads: '850', size: '22.5 MB', pages: '80 slide', tone: 'green' },
  { id: 4, type: 'ZIP', category: 'Đồ án mẫu', code: 'WEB402', subject: 'Lập trình Web nâng cao', title: 'Mã nguồn đồ án E-commerce hoàn chỉnh sử dụng ReactJS', description: 'Đồ án đạt điểm A+ với đầy đủ tính năng giỏ hàng, thanh toán và quản trị sản phẩm.', author: 'Phạm Minh Quân', initials: 'PM', rating: '5.0', downloads: '3.4k', size: '35.1 MB', pages: 'Source code', tone: 'orange' },
  { id: 5, type: 'PDF', category: 'Ghi chép', code: 'PHY102', subject: 'Vật lý đại cương 2', title: 'Vở ghi chép Vật lý đại cương 2 viết tay sắc nét điểm A+', description: 'Tập vở ghi chép đầy đủ các buổi lên lớp của thủ khoa trường Đại học Khoa học.', author: 'Hoàng Quốc Huy', initials: 'HQ', rating: '4.9', downloads: '920', size: '8.6 MB', pages: '62 trang', tone: 'purple' },
  { id: 6, type: 'PDF', category: 'Giáo trình', code: 'DB301', subject: 'Hệ quản trị cơ sở dữ liệu', title: 'Tối ưu hóa câu lệnh SQL nâng cao và thiết kế cơ sở dữ liệu', description: 'Tài liệu chuyên sâu về Indexing, Execution Plan, Stored Procedure và các kỹ thuật tối ưu.', author: 'Đinh Mai Phương', initials: 'DM', rating: '4.9', downloads: '1.8k', size: '18.3 MB', pages: '110 trang', tone: 'slate' },
]

function Toggle({ checked, onChange, label }) {
  return (
    <label className="account-toggle" aria-label={label}>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <i aria-hidden="true" />
    </label>
  )
}

export function AccountSettingsPage({ authenticated = false, onLogout = () => {} }) {
  const [twoFactor, setTwoFactor] = useState(true)
  const [preferences, setPreferences] = useState({ approved: true, comments: true, mentions: true, followed: false })

  const updatePreference = (key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  return (
    <ProfileShell activeSidebar="settings" authenticated={authenticated} onLogout={onLogout}>
      <div className="settings-heading">
        <span>QUẢN LÝ HỆ THỐNG</span>
        <h1>Cài đặt tài khoản</h1>
        <p>Quản lý thông tin cá nhân, bảo mật và tùy chỉnh thông báo học tập của bạn.</p>
      </div>

      <div className="settings-layout">
        <div className="settings-layout__main">
          <section className="settings-card account-info-card">
            <header><h2>Thông tin tài khoản</h2><Link to="/profile/edit"><ProfileIcon name="edit" size={16} /> Chỉnh sửa hồ sơ</Link></header>
            <div className="account-info-card__person">
              <span className="account-avatar">NA</span>
              <div><h3>Nguyễn Văn An</h3><p>student@edushare.edu.vn</p><span>Sinh viên năm 3</span><small>Khoa Công nghệ Thông tin</small></div>
            </div>
            <div className="account-summary"><strong>GIỚI THIỆU NGẮN (SUMMARY)</strong><p>Đam mê lập trình Web, trí tuệ nhân tạo và chia sẻ tài liệu học tập chất lượng cao cho cộng đồng sinh viên EduShare.</p></div>
          </section>

          <section className="settings-card security-card">
            <header><div><h2>Bảo mật tài khoản</h2><p>Quản lý mật khẩu và các thiết lập bảo mật đăng nhập</p></div><span><ProfileIcon name="shield" size={19} /></span></header>
            <div className="security-row"><div><strong>Mật khẩu</strong><p>Cập nhật lần cuối 3 tháng trước</p></div><Link to="/forgot-password">Đổi mật khẩu</Link></div>
            <div className="security-row"><div><strong>Xác thực 2 bước (2FA)</strong><p>Bảo vệ tài khoản với mã OTP qua email</p></div><Toggle checked={twoFactor} label="Xác thực hai bước" onChange={setTwoFactor} /></div>
          </section>
        </div>

        <aside className="settings-card notification-settings">
          <header><span><ProfileIcon name="bell" size={19} /></span><div><h2>Thông báo</h2><p>Tùy chỉnh nhận tin</p></div></header>
          <div className="notification-setting-list">
            <div><span><strong>Phê duyệt tài liệu</strong><small>Nhận thông báo khi tài liệu bạn tải lên được kiểm duyệt</small></span><Toggle checked={preferences.approved} label="Thông báo phê duyệt tài liệu" onChange={(value) => updatePreference('approved', value)} /></div>
            <div><span><strong>Bình luận mới</strong><small>Thông báo khi có ai bình luận vào tài liệu của bạn</small></span><Toggle checked={preferences.comments} label="Thông báo bình luận mới" onChange={(value) => updatePreference('comments', value)} /></div>
            <div><span><strong>Thẻ nhắc tên (Mentions)</strong><small>Thông báo khi ai đó nhắc đến tên bạn trong thảo luận</small></span><Toggle checked={preferences.mentions} label="Thông báo nhắc tên" onChange={(value) => updatePreference('mentions', value)} /></div>
            <div><span><strong>Môn học đã theo dõi</strong><small>Nhận thông báo khi có tài liệu mới từ các môn bạn theo dõi</small></span><Toggle checked={preferences.followed} label="Thông báo môn học theo dõi" onChange={(value) => updatePreference('followed', value)} /></div>
          </div>
          <button type="button">Lưu thay đổi</button>
        </aside>
      </div>
    </ProfileShell>
  )
}

export function FavoriteDocumentsPage({ authenticated = false, onLogout = () => {} }) {
  const [query, setQuery] = useState('')
  const [documents, setDocuments] = useState(favoriteDocuments)
  const visibleDocuments = documents.filter((document) => [document.title, document.subject, document.code].some((value) => value.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))))

  return (
    <ProfileShell activeSidebar="favorites" authenticated={authenticated} onLogout={onLogout}>
      <div className="favorites-heading">
        <div><p>THƯ VIỆN CÁ NHÂN <span>•</span> <small>{documents.length} tài liệu đã lưu</small></p><h1>Tài liệu yêu thích</h1><h2>Quản lý và truy cập nhanh chóng các tài liệu học tập bạn đã đánh dấu sao.</h2></div>
        <div><button type="button"><ProfileIcon name="folder" size={16} /> Quản lý thư mục</button><button type="button"><ProfileIcon name="download" size={16} /> Tải tất cả (.zip)</button></div>
      </div>

      <section className="favorites-toolbar">
        <label><span>⌕</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm trong tài liệu yêu thích..." type="search" value={query} /></label>
        <select defaultValue="all-subjects"><option value="all-subjects">Tất cả môn học</option><option value="it">Công nghệ thông tin</option><option value="economics">Kinh tế</option></select>
        <select defaultValue="all-types"><option value="all-types">Loại tài liệu</option><option value="pdf">PDF</option><option value="docx">DOCX</option><option value="pptx">PPTX</option></select>
        <button type="button">Mới lưu gần đây ☰</button>
      </section>

      <section className="favorite-grid" aria-label="Danh sách tài liệu yêu thích">
        {visibleDocuments.map((document) => (
          <article className="favorite-card" key={document.id}>
            <div className={`favorite-card__summary favorite-card__summary--${document.tone}`}>
              <span className="favorite-card__category">{document.category}</span>
              <button aria-label={`Bỏ lưu ${document.title}`} onClick={() => setDocuments((current) => current.filter((item) => item.id !== document.id))} type="button">♥</button>
              <span className="favorite-card__file-icon"><ProfileIcon name="file" size={34} /></span>
              <strong>{document.type}</strong>
              <p>{document.type} • {document.size}<span>{document.pages}</span></p>
            </div>
            <div className="favorite-card__body">
              <p className="favorite-card__subject"><b>{document.code}</b>{document.subject}</p>
              <h3>{document.title}</h3>
              <p className="favorite-card__description">{document.description}</p>
              <div className="favorite-card__author"><span>{document.initials}</span><div><strong>{document.author}</strong><small>★ {document.rating} <i>•</i> {document.downloads} tải</small></div></div>
              <footer><button type="button">◉ Xem trước</button><button type="button"><ProfileIcon name="download" size={15} /> Tải xuống</button></footer>
            </div>
          </article>
        ))}
        {visibleDocuments.length === 0 && <p className="favorites-empty">Không tìm thấy tài liệu yêu thích phù hợp.</p>}
      </section>

      <nav className="favorites-pagination" aria-label="Phân trang"><button disabled type="button">‹</button><button className="favorites-pagination__active" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">›</button></nav>
    </ProfileShell>
  )
}
