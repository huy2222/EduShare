import { useState } from 'react'
import { HomeHeader } from './HomePage'
import '../styles/profile.css'

const sidebarItems = [
  { icon: 'user', label: 'Hồ sơ cá nhân', href: '#profile', key: 'profile' },
  { icon: 'folder', label: 'Tài liệu của tôi', href: '#my-documents', key: 'documents' },
  { icon: 'bookmark', label: 'Tài liệu yêu thích', href: '#favorites', key: 'favorites' },
  { icon: 'download', label: 'Lịch sử tải xuống', href: '#downloads', key: 'downloads' },
  { icon: 'bell', label: 'Thông báo', href: '#notifications', key: 'notifications' },
  { icon: 'settings', label: 'Cài đặt tài khoản', href: '#settings', key: 'settings' },
]

const stats = [
  { icon: 'file', label: 'Tài liệu đã đăng', value: '24', detail: '+3 tháng này', tone: 'blue' },
  { icon: 'check', label: 'Tài liệu được duyệt', value: '18', detail: 'Tỷ lệ duyệt 75%', tone: 'green' },
  { icon: 'bookmark', label: 'Tài liệu yêu thích', value: '12', detail: 'Đã lưu để học tập', tone: 'violet' },
  { icon: 'download', label: 'Lượt tải tài liệu của tôi', value: '1,842', detail: '+120 tuần này', tone: 'sky' },
]

const activities = [
  { icon: 'file', tone: 'blue', text: <>Bạn đã tải lên tài liệu mới <b>“Đề cương ôn tập Cấu trúc dữ liệu và Giải thuật.pdf”</b></>, meta: '2 giờ trước • Môn: Cấu trúc dữ liệu' },
  { icon: 'check', tone: 'green', text: <>Tài liệu <b>“Slide bài giảng Lập trình Web nâng cao - Chương 4”</b> đã được kiểm duyệt và công khai.</>, meta: 'Hôm qua, 14:30 • Môn: Lập trình Web' },
  { icon: 'bookmark', tone: 'violet', text: <>Bạn đã lưu vào danh sách yêu thích <b>“Tổng hợp đề thi cuối kỳ Cơ sở dữ liệu 2023”</b></>, meta: '3 ngày trước • Môn: Cơ sở dữ liệu' },
  { icon: 'download', tone: 'sky', text: <>Bạn đã tải xuống tài liệu <b>“Bài tập lớn Trí tuệ nhân tạo - Nhóm 5.zip”</b></>, meta: '5 ngày trước • Môn: Trí tuệ nhân tạo' },
]

export function ProfileIcon({ name, size = 20 }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    folder: <path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
    bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    building: <><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 10h1M14 10h1M9 14h1M14 14h1" /></>,
    graduation: <><path d="m2 8 10-5 10 5-10 5Z" /><path d="M6 10v5c3 3 9 3 12 0v-5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    verified: <><path d="m12 2 2.2 1.5 2.7-.2.9 2.5 2.3 1.4-.6 2.6 1.2 2.2-1.2 2.2.6 2.6-2.3 1.4-.9 2.5-2.7-.2L12 22l-2.2-1.5-2.7.2-.9-2.5-2.3-1.4.6-2.6L3.3 12l1.2-2.2-.6-2.6 2.3-1.4.9-2.5 2.7.2Z" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    cloud: <><path d="M16 16l-4-4-4 4M12 12v9" /><path d="M20 17.5A5 5 0 0 0 18 8a7 7 0 0 0-13.5 2.6A4.5 4.5 0 0 0 6 19h2" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    camera: <><path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2Z" /><circle cx="12" cy="13" r="3" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    save: <><path d="M5 3h12l2 2v16H5Z" /><path d="M8 3v6h8V3M8 21v-7h8v7" /></>,
    phone: <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z" />,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" /></>,
  }

  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      {paths[name]}
    </svg>
  )
}

function ProfileSidebar({ active = 'profile', editMode = false }) {
  return (
    <aside className="profile-sidebar">
      <p>WORKSPACE</p>
      <nav aria-label="Không gian cá nhân">
        {sidebarItems.map((item) => (
          <a className={active === item.key ? 'profile-sidebar__active' : ''} href={item.href} key={item.key}>
            <ProfileIcon name={item.icon} size={18} />
            {item.label}
          </a>
        ))}
      </nav>
      {editMode && (
        <div className="profile-contributor">
          <span><ProfileIcon name="graduation" size={18} /></span>
          <div><strong>Cộng tác viên học tập</strong><small>Đã đóng góp 14 tài liệu</small></div>
        </div>
      )}
    </aside>
  )
}

export function ProfileShell({ authenticated, onLogout, activeSidebar = 'profile', editMode = false, children }) {
  const [searchInput, setSearchInput] = useState('')

  return (
    <div className="profile-page">
      <HomeHeader
        activePage=""
        authenticated={authenticated}
        onLogout={onLogout}
        onSearchChange={(event) => setSearchInput(event.target.value)}
        onSearchSubmit={(event) => event.preventDefault()}
        searchInput={searchInput}
      />
      <main className="profile-main">
        <ProfileSidebar active={activeSidebar} editMode={editMode} />
        <div className="profile-content">{children}</div>
      </main>
      <footer className="profile-footer">© 2024 EduShare Platform. All rights reserved.</footer>
    </div>
  )
}

function ProfileAvatar({ editable = false }) {
  return (
    <div className={`profile-avatar${editable ? ' profile-avatar--editable' : ''}`}>
      <span>NA</span>
      <i aria-hidden="true" />
      {editable && <button aria-label="Đổi ảnh đại diện" type="button"><ProfileIcon name="camera" size={15} /></button>}
    </div>
  )
}

export function ProfilePage({ authenticated = false, onLogout = () => {} }) {
  return (
    <ProfileShell authenticated={authenticated} onLogout={onLogout}>
      <section className="profile-overview-card">
        <ProfileAvatar />
        <div className="profile-overview-card__body">
          <div className="profile-name-row">
            <h1>Nguyễn Văn A</h1>
            <span>Sinh viên ưu tú</span>
          </div>
          <p className="profile-email"><ProfileIcon name="mail" size={16} /> nguyenvana@student.edu.vn</p>
          <div className="profile-education-grid">
            <div><span><ProfileIcon name="building" size={18} /></span><small>Khoa</small><strong>Công nghệ thông tin</strong></div>
            <div><span><ProfileIcon name="graduation" size={18} /></span><small>Chuyên ngành</small><strong>Công nghệ phần mềm</strong></div>
          </div>
          <p className="profile-meta"><ProfileIcon name="calendar" size={15} /> Tham gia: Tháng 9, 2022 <i>•</i> <ProfileIcon name="verified" size={16} /> Đã xác thực tài khoản sinh viên</p>
        </div>
        <div className="profile-overview-card__actions">
          <a href="#profile/edit"><ProfileIcon name="edit" size={17} /> Chỉnh sửa hồ sơ</a>
          <button type="button"><ProfileIcon name="share" size={17} /> Chia sẻ hồ sơ</button>
        </div>
      </section>

      <section className="profile-stats" aria-label="Thống kê hồ sơ">
        {stats.map((stat) => (
          <article className="profile-stat-card" key={stat.label}>
            <span className={`profile-tone profile-tone--${stat.tone}`}><ProfileIcon name={stat.icon} size={24} /></span>
            <div><small>{stat.label}</small><strong>{stat.value}</strong><p>{stat.detail}</p></div>
          </article>
        ))}
      </section>

      <div className="profile-dashboard-grid">
        <section className="profile-panel profile-activity">
          <header><h2>Hoạt động gần đây</h2><a href="#all-activities">Xem tất cả</a></header>
          <div className="profile-activity__list">
            {activities.map((activity, index) => (
              <article key={index}>
                <span className={`profile-tone profile-tone--${activity.tone}`}><ProfileIcon name={activity.icon} size={18} /></span>
                <div><p>{activity.text}</p><small>{activity.meta}</small></div>
              </article>
            ))}
          </div>
        </section>

        <aside className="profile-dashboard-aside">
          <section className="profile-panel profile-quick-actions">
            <h2>Thao tác nhanh</h2>
            <p>Các lối tắt truy cập nhanh các tính năng quản lý tài liệu học tập của bạn.</p>
            <a className="profile-quick-actions__primary" href="#upload"><ProfileIcon name="cloud" size={19} /><span><strong>Tải tài liệu lên</strong><small>Chia sẻ tài liệu cho cộng đồng</small></span><ProfileIcon name="arrow" size={18} /></a>
            <a href="#my-documents"><ProfileIcon name="folder" size={19} /><span><strong>Quản lý tài liệu</strong><small>Xem và chỉnh sửa tài liệu đã đăng</small></span><ProfileIcon name="arrow" size={18} /></a>
            <a href="#favorites"><ProfileIcon name="bookmark" size={19} /><span><strong>Tài liệu yêu thích</strong><small>Truy cập nhanh tài liệu đã lưu</small></span><ProfileIcon name="arrow" size={18} /></a>
          </section>
          <section className="profile-student-card">
            <span><ProfileIcon name="shield" size={23} /></span>
            <div><h3>Tài khoản Sinh viên</h3><p>Quyền lợi đầy đủ trên EduShare</p></div>
            <p>Bạn có quyền tải xuống không giới hạn các tài liệu học tập chuẩn từ trường Đại học.</p>
            <a href="#membership">Xem chính sách thành viên</a>
          </section>
        </aside>
      </div>
    </ProfileShell>
  )
}

function SectionHeader({ icon, title, subtitle, trailing }) {
  return (
    <header className="profile-form-section__header">
      <span><ProfileIcon name={icon} size={19} /></span>
      <div><h2>{title}</h2><p>{subtitle}</p></div>
      {trailing}
    </header>
  )
}

function ProfileField({ label, icon, children, note, className = '' }) {
  return (
    <label className={`profile-form-field ${className}`}>
      <span>{label}</span>
      <span className="profile-form-field__control">
        {icon && <ProfileIcon name={icon} size={16} />}
        {children}
      </span>
      {note && <small>{note}</small>}
    </label>
  )
}

export function EditProfilePage({ authenticated = false, onLogout = () => {} }) {
  const [cohort, setCohort] = useState('k66')

  return (
    <ProfileShell authenticated={authenticated} editMode onLogout={onLogout}>
      <div className="profile-edit-heading">
        <div>
          <nav><a href="#home">Trang chủ</a><span>›</span><a href="#profile">Không gian cá nhân</a><span>›</span><strong>Chỉnh sửa hồ sơ</strong></nav>
          <h1>Chỉnh sửa hồ sơ cá nhân</h1>
          <p>Cập nhật thông tin học tập, thông tin liên hệ và tùy chỉnh nhận diện tài khoản EduShare của bạn.</p>
        </div>
        <span className="profile-verified-badge"><ProfileIcon name="shield" size={16} /> Sinh viên đã xác thực</span>
      </div>

      <form className="profile-edit-form" onSubmit={(event) => event.preventDefault()}>
        <section className="profile-cover-card">
          <span className="profile-cover-card__label">▣ Ảnh bìa EduShare Profile</span>
          <div className="profile-cover-card__content">
            <ProfileAvatar editable />
            <div><h2>Ảnh đại diện &amp; Nhận diện</h2><p>Định dạng hỗ trợ JPG, PNG hoặc GIF. Kích thước tối đa 5MB.</p><span>✓ Tỷ lệ khuyến nghị 1:1</span> <small>400×400px</small></div>
            <div className="profile-cover-card__actions"><button type="button"><ProfileIcon name="cloud" size={17} /> Tải ảnh mới</button><button type="button"><ProfileIcon name="trash" size={17} /> Gỡ ảnh</button></div>
          </div>
        </section>

        <section className="profile-form-section">
          <SectionHeader icon="graduation" title="Thông tin học vấn & Trường đại học" subtitle="Dữ liệu liên kết phân quyền tải tài liệu và chuyên ngành học" trailing={<span className="profile-lock-pill"><ProfileIcon name="lock" size={13} /> Khóa sau khi xác nhận</span>} />
          <div className="profile-form-grid">
            <ProfileField label="Mã số sinh viên (MSSV)" icon="calendar" note="Gắn liền với định danh thẻ sinh viên & email trường cung cấp."><input defaultValue="21020485" disabled /></ProfileField>
            <ProfileField label="Trường Đại học" icon="building"><select defaultValue="uet"><option value="uet">Trường Đại học Công nghệ - ĐHQGHN (UET)</option><option value="hcmute">Đại học Sư phạm Kỹ thuật TP.HCM</option></select></ProfileField>
            <ProfileField label="Khoa / Viện đào tạo"><select defaultValue="it"><option value="it">Khoa Công nghệ Thông tin</option><option value="electronics">Khoa Điện - Điện tử</option></select></ProfileField>
            <ProfileField label="Chuyên ngành đào tạo"><select defaultValue="software"><option value="software">Kỹ thuật Phần mềm</option><option value="computer-science">Khoa học Máy tính</option></select></ProfileField>
          </div>
          <fieldset className="profile-cohorts">
            <legend>Khóa học</legend>
            <div>
              {[['k66', 'Khóa CH-2021 (K66)', 'Năm 2021 - 2025'], ['k67', 'Khóa CH-2022 (K67)', 'Năm 2022 - 2026'], ['k68', 'Khóa QH-2023 (K68)', 'Năm 2023 - 2027']].map(([value, label, year]) => (
                <label className={cohort === value ? 'profile-cohort--active' : ''} key={value}><input checked={cohort === value} name="cohort" onChange={() => setCohort(value)} type="radio" /><i /><span><strong>{label}</strong><small>{year}</small></span></label>
              ))}
            </div>
          </fieldset>
          <div className="profile-form-actions"><p><ProfileIcon name="info" size={16} /> Mọi thay đổi sẽ có hiệu lực tức thì trên toàn bộ trang cá nhân của bạn.</p><a href="#profile">Hủy bỏ</a><button type="submit"><ProfileIcon name="save" size={16} /> Lưu thay đổi</button></div>
        </section>

        <section className="profile-form-section">
          <SectionHeader icon="user" title="Thông tin cá nhân & Giới thiệu" subtitle="Tùy biến hiển thị tên, giới thiệu bản thân và thông tin kết nối" />
          <div className="profile-form-grid">
            <ProfileField label="Họ và tên hiển thị" icon="user"><input defaultValue="Nguyễn Văn A" /></ProfileField>
            <ProfileField label="Email sinh viên (Tài khoản EduShare)" icon="mail"><input defaultValue="nguyenvana@student.edu.vn" disabled /></ProfileField>
            <ProfileField label="Số điện thoại liên hệ" icon="phone"><input defaultValue="0912 345 678" /></ProfileField>
            <ProfileField label="Trạng thái / Danh hiệu học tập" icon="graduation"><input defaultValue="Sinh viên K66 - Đam mê Công nghệ phần mềm & Hệ thống" /></ProfileField>
            <ProfileField className="profile-form-field--wide" label="Giới thiệu bản thân (Bio)"><textarea defaultValue="Chào mọi người! Mình là sinh viên ngành Kỹ thuật Phần mềm. Rất vui được chia sẻ các bộ tài liệu bài giảng, đề thi cuối kỳ và slide hướng dẫn thực hành đã được tổng hợp kỹ lưỡng." rows="4" /></ProfileField>
          </div>
          <div className="profile-social-fields">
            <p>Liên kết học thuật &amp; Mạng xã hội</p>
            <div><ProfileField icon="link" label=""><input aria-label="Liên kết GitHub" defaultValue="https://github.com/nguyenvana-uet" /></ProfileField><ProfileField icon="share" label=""><input aria-label="Liên kết LinkedIn" defaultValue="https://linkedin.com/in/nguyenvana-dev" /></ProfileField></div>
          </div>
        </section>
      </form>
    </ProfileShell>
  )
}
