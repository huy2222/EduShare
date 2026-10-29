import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HomeHeader } from './HomePage'
import { getAcademicCatalog } from '../services/academicApi'
import { getMyProfile, updateMyProfile } from '../services/profileApi'
import '../styles/profile.css'

const sidebarItems = [
  { icon: 'user', label: 'Hồ sơ cá nhân', href: '/profile', key: 'profile' },
  { icon: 'folder', label: 'Tài liệu của tôi', href: '/my-documents', key: 'documents' },
  { icon: 'bookmark', label: 'Tài liệu yêu thích', href: '/favorites', key: 'favorites' },
  { icon: 'download', label: 'Lịch sử tải xuống', href: '/downloads', key: 'downloads' },
  { icon: 'bell', label: 'Thông báo', href: '/notifications', key: 'notifications' },
  { icon: 'settings', label: 'Cài đặt tài khoản', href: '/settings', key: 'settings' },
]

const EMPTY_PROFILE = {
  fullName: '',
  email: '',
  phone: '',
  bio: '',
  facultyId: '',
  majorId: '',
  githubUrl: '',
  linkedinUrl: '',
}

export function ProfileIcon({ name, size = 20 }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    folder: <path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
    bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    building: <><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 10h1M14 10h1M9 14h1M14 14h1" /></>,
    graduation: <><path d="m2 8 10-5 10 5-10 5Z" /><path d="M6 10v5c3 3 9 3 12 0v-5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
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
          <Link className={active === item.key ? 'profile-sidebar__active' : ''} to={item.href} key={item.key}>
            <ProfileIcon name={item.icon} size={18} />
            {item.label}
          </Link>
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

export function ProfilePage({ authenticated = false, onLogout = () => {} }) {
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProfile = () => {
    setLoading(true)
    setError('')
    getMyProfile()
      .then((response) => setProfile(response.result))
      .catch((requestError) => setError(requestError.message || 'Không thể tải hồ sơ cá nhân.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const joinedAt = profile?.createdAt
    ? new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(new Date(profile.createdAt))
    : 'Chưa xác định'

  return (
    <ProfileShell authenticated={authenticated} onLogout={onLogout}>
      {location.state?.profileUpdated && (
        <p className="profile-message profile-message--success" role="status">Thông tin cá nhân đã được cập nhật.</p>
      )}

      {loading && <div className="profile-state" role="status">Đang tải hồ sơ cá nhân…</div>}

      {!loading && error && (
        <div className="profile-state profile-state--error" role="alert">
          <p>{error}</p>
          <button onClick={loadProfile} type="button">Thử lại</button>
        </div>
      )}

      {!loading && !error && profile && (
        <>
          <section className="profile-overview-card">
            <div className="profile-overview-card__body">
              <div className="profile-name-row"><h1>{profile.fullName}</h1></div>
              <p className="profile-email"><ProfileIcon name="mail" size={16} /> {profile.email}</p>
              <div className="profile-education-grid">
                <div><span><ProfileIcon name="building" size={18} /></span><small>Khoa</small><strong>{profile.facultyName || 'Chưa cập nhật'}</strong></div>
                <div><span><ProfileIcon name="graduation" size={18} /></span><small>Chuyên ngành</small><strong>{profile.majorName || 'Chưa cập nhật'}</strong></div>
              </div>
              <p className="profile-meta"><ProfileIcon name="calendar" size={15} /> Tham gia: {joinedAt}</p>
            </div>
            <div className="profile-overview-card__actions">
              <Link to="/profile/edit"><ProfileIcon name="edit" size={17} /> Chỉnh sửa hồ sơ</Link>
            </div>
          </section>

          <div className="profile-details-grid">
            <section className="profile-panel profile-about">
              <h2>Giới thiệu bản thân</h2>
              <p>{profile.bio || 'Bạn chưa thêm phần giới thiệu bản thân.'}</p>
              <div className="profile-contact-row">
                <ProfileIcon name="phone" size={17} />
                <span>{profile.phone || 'Chưa cập nhật số điện thoại'}</span>
              </div>
            </section>

            <section className="profile-panel profile-links">
              <h2>Liên kết học thuật &amp; Mạng xã hội</h2>
              {profile.githubUrl || profile.linkedinUrl ? (
                <div>
                  {profile.githubUrl && <a href={profile.githubUrl} rel="noreferrer" target="_blank"><ProfileIcon name="link" size={17} /> GitHub</a>}
                  {profile.linkedinUrl && <a href={profile.linkedinUrl} rel="noreferrer" target="_blank"><ProfileIcon name="share" size={17} /> LinkedIn</a>}
                </div>
              ) : (
                <p>Bạn chưa thêm liên kết nào.</p>
              )}
            </section>
          </div>
        </>
      )}
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
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_PROFILE)
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const availableMajors = useMemo(
    () => faculties.find((faculty) => String(faculty.id) === form.facultyId)?.majors || [],
    [faculties, form.facultyId],
  )

  useEffect(() => {
    let active = true
    Promise.all([getMyProfile(), getAcademicCatalog()])
      .then(([profileResponse, catalogResponse]) => {
        if (!active) return
        const profile = profileResponse.result
        setFaculties(catalogResponse.result || [])
        setForm({
          fullName: profile.fullName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
          facultyId: profile.facultyId ? String(profile.facultyId) : '',
          majorId: profile.majorId ? String(profile.majorId) : '',
          githubUrl: profile.githubUrl || '',
          linkedinUrl: profile.linkedinUrl || '',
        })
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Không thể tải thông tin cá nhân.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleFacultyChange = (event) => {
    const facultyId = event.target.value
    const firstMajor = faculties.find((faculty) => String(faculty.id) === facultyId)?.majors?.[0]
    setForm((current) => ({
      ...current,
      facultyId,
      majorId: firstMajor ? String(firstMajor.id) : '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await updateMyProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        facultyId: form.facultyId || null,
        majorId: form.majorId || null,
        githubUrl: form.githubUrl.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
      })
      navigate('/profile', { replace: true, state: { profileUpdated: true } })
    } catch (requestError) {
      setError(requestError.message || 'Không thể lưu thay đổi. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProfileShell authenticated={authenticated} editMode onLogout={onLogout}>
      <div className="profile-edit-heading">
        <div>
          <h1>Chỉnh sửa hồ sơ cá nhân</h1>
        </div>
      </div>

      {loading ? (
        <div className="profile-state" role="status">Đang tải thông tin cá nhân…</div>
      ) : (
        <form className="profile-edit-form" onSubmit={handleSubmit}>
          {error && <p className="profile-message profile-message--error" role="alert">{error}</p>}

          <section className="profile-form-section">
            <SectionHeader icon="graduation" title="Thông tin học vấn"  />
            <div className="profile-form-grid">
              <ProfileField label="Khoa / Viện đào tạo">
                <select onChange={handleFacultyChange} value={form.facultyId}>
                  <option value="">Chưa cập nhật</option>
                  {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
                </select>
              </ProfileField>
              <ProfileField label="Chuyên ngành đào tạo">
                <select disabled={!form.facultyId} onChange={updateField('majorId')} value={form.majorId}>
                  <option value="">Chưa cập nhật</option>
                  {availableMajors.map((major) => <option key={major.id} value={major.id}>{major.name}</option>)}
                </select>
              </ProfileField>
            </div>
          </section>

          <section className="profile-form-section">
            <SectionHeader icon="user" title="Thông tin cá nhân & Giới thiệu" />
            <div className="profile-form-grid">
              <ProfileField label="Họ và tên hiển thị" icon="user"><input maxLength="100" onChange={updateField('fullName')} required value={form.fullName} /></ProfileField>
              <ProfileField label="Email" icon="mail"><input disabled value={form.email} /></ProfileField>
              <ProfileField label="Số điện thoại liên hệ" icon="phone"><input maxLength="20" onChange={updateField('phone')} value={form.phone} /></ProfileField>
              <ProfileField className="profile-form-field--wide" label="Giới thiệu bản thân (Bio)"><textarea maxLength="1000" onChange={updateField('bio')} rows="4" value={form.bio} /></ProfileField>
            </div>
            <div className="profile-social-fields">
              <p>Liên kết học thuật &amp; Mạng xã hội</p>
              <div>
                <ProfileField icon="link" label="GitHub"><input aria-label="Liên kết GitHub" maxLength="500" onChange={updateField('githubUrl')} placeholder="https://github.com/ten-tai-khoan" type="url" value={form.githubUrl} /></ProfileField>
                <ProfileField icon="share" label="LinkedIn"><input aria-label="Liên kết LinkedIn" maxLength="500" onChange={updateField('linkedinUrl')} placeholder="https://linkedin.com/in/ten-tai-khoan" type="url" value={form.linkedinUrl} /></ProfileField>
              </div>
            </div>
          </section>

          <div className="profile-form-actions">
            <p><ProfileIcon name="info" size={16} /> Thay đổi sẽ hiển thị ngay trên hồ sơ cá nhân.</p>
            <button className="profile-form-actions__cancel" disabled={submitting} onClick={() => navigate('/profile')} type="button">Hủy bỏ</button>
            <button disabled={submitting} type="submit"><ProfileIcon name="save" size={16} /> {submitting ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
          </div>
        </form>
      )}
    </ProfileShell>
  )
}
