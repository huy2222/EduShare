import { hasPermission, sectionPermissions } from '../services/adminAccess'
import AdminAccess from '../components/AdminAccess'
import Catalog from '../components/AdminCatalog'
import { Modal, Pagination } from '../components/AdminUi'
import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, useParams } from 'react-router-dom'
import { getCurrentUser } from '../services/authApi'
import {
  getOverview,
  getRoles,
  getUsers,
  updateUser,
} from '../services/adminApi'
import brandMark from '../assets/brand-mark.svg'
import '../styles/admin.css'

const sections = {
  overview: 'Tổng quan',
  users: 'Quản lý người dùng',
  faculties: 'Khoa & ngành',
  subjects: 'Quản lý môn học',
  access: 'Phân quyền & vai trò',
}
const roleLabel = (role) =>
  ({
    ADMIN: 'Quản trị viên',
    USER: 'Người dùng',
    MODERATOR: 'Kiểm duyệt viên',
    LECTURER: 'Giảng viên',
  })[role] || role
const statuses = {
  ACTIVE: 'Đang hoạt động',
  BANNED: 'Đã khoá',
  INACTIVE: 'Ngừng hoạt động',
  PENDING_VERIFICATION: 'Chờ xác thực',
}
const number = (value) => (value || 0).toLocaleString('vi-VN')

function Icon({ name }) {
  const paths = {
    access: (
      <>
        <path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5" />
      </>
    ),
    faculties: (
      <>
        <path d="M3 21h18M5 21V6l7-3 7 3v15M9 8h1m4 0h1M9 12h1m4 0h1M10 21v-5h4v5" />
      </>
    ),
    subjects: (
      <>
        <path d="M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1v16" />
      </>
    ),
    arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
    search: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="m15 15 6 6" />
      </>
    ),
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.subjects}
    </svg>
  )
}

function Stats({ data }) {
  return (
    <div className="admin-stats">
      {[
        ['users', 'Tổng người dùng'],
        ['faculties', 'Khoa đào tạo'],
        ['subjects', 'Môn học'],
        ['documents', 'Tổng tài liệu'],
      ].map(([key, label]) => (
        <article key={key} className="admin-stat">
          <div>
            <p>{label}</p>
            <strong>{number(data[key])}</strong>
            <small>Dữ liệu trong hệ thống</small>
          </div>
          <span className={`admin-stat-icon ${key}`}>
            <Icon name={key} />
          </span>
        </article>
      ))}
    </div>
  )
}

function Overview() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    getOverview()
      .then((r) => {
        if (active) {
          setData(r.result)
          setError('')
        }
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [retry])
  if (error)
    return (
      <p role="alert">
        {error} <button onClick={() => setRetry((v) => v + 1)}>Thử lại</button>
      </p>
    )
  if (!data) return <p role="status">Đang tải tổng quan…</p>
  const activePercent = data.users
    ? Math.round((data.activeUsers / data.users) * 100)
    : 0
  return (
    <>
      <Stats data={data} />
      <div className="admin-overview-grid">
        <section className="admin-panel">
          <h2>Trạng thái tài khoản</h2>
          <p className="admin-muted">
            Theo dõi tình hình người dùng trên EduShare.
          </p>
          <div className="admin-account-summary">
            <strong>
              {activePercent}
              <small>%</small>
            </strong>
            <span>tài khoản đang hoạt động</span>
          </div>
          <div className="admin-progress">
            <span style={{ width: `${activePercent}%` }} />
          </div>
          <div className="admin-status-list">
            <p>
              <span>Đang hoạt động</span>
              <b>{number(data.activeUsers)}</b>
            </p>
            <p>
              <span>Đã khoá / ngừng hoạt động</span>
              <b>{number(data.lockedUsers)}</b>
            </p>
            <p>
              <span>Chờ xác thực</span>
              <b>{number(data.users - data.activeUsers - data.lockedUsers)}</b>
            </p>
          </div>
          <Link className="admin-text-link" to="/admin/users">
            Xem danh sách người dùng →
          </Link>
        </section>
        <section className="admin-panel">
          <h2>Thao tác nhanh</h2>
          <p className="admin-muted">Truy cập các chức năng quản trị.</p>
          {['users', 'faculties', 'subjects'].map((key) => (
            <Link className="admin-quick-link" key={key} to={`/admin/${key}`}>
              <span className="admin-stat-icon">
                <Icon name={key} />
              </span>
              <div>
                <b>{sections[key]}</b>
                <small>
                  {key === 'users'
                    ? 'Phân quyền và trạng thái tài khoản'
                    : key === 'faculties'
                      ? 'Quản lý khoa và các ngành trực thuộc'
                      : 'Thêm và sắp xếp môn học theo khoa'}
                </small>
              </div>
              <span>→</span>
            </Link>
          ))}
        </section>
      </div>
    </>
  )
}

function Users({ currentUser }) {
  const isAdmin = currentUser.roles?.includes('ADMIN')
  const canAssign =
    isAdmin || currentUser.permissions?.includes('USER_ROLE_ASSIGN')
  const canBan = isAdmin || currentUser.permissions?.includes('USER_BAN')
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 0,
  })
  const [data, setData] = useState({ content: [], totalElements: 0 })
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    getRoles()
      .then((r) => {
        if (active) setRoles(r.result)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [reload])
  useEffect(() => {
    let active = true
    setLoading(true)
    const timer = setTimeout(
      () =>
        getUsers(filters)
          .then((r) => {
            if (active) {
              setData(r.result)
              setError('')
            }
          })
          .catch((e) => {
            if (active) setError(e.message)
          })
          .finally(() => {
            if (active) setLoading(false)
          }),
      filters.search ? 250 : 0,
    )
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [filters, reload])
  const filter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: 0 }))
  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setModalError('')
    try {
      await updateUser(editing.id, {
        roles: editing.roles,
        status: editing.status,
      })
      setEditing(null)
      setNotice('Đã cập nhật tài khoản.')
      setReload((v) => v + 1)
    } catch (e) {
      setModalError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <div className="admin-toolbar">
        <label className="admin-search">
          <Icon name="search" />
          <input
            aria-label="Tìm người dùng"
            placeholder="Tìm theo tên hoặc email…"
            value={filters.search}
            onChange={(e) => filter('search', e.target.value)}
          />
        </label>
        <select
          aria-label="Lọc vai trò"
          value={filters.role}
          onChange={(e) => filter('role', e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc trạng thái"
          value={filters.status}
          onChange={(e) => filter('status', e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statuses).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            setFilters({ search: '', role: '', status: '', page: 0 })
          }
        >
          Đặt lại
        </button>
      </div>
      {notice && (
        <p className="admin-success" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}{' '}
          <button onClick={() => setReload((v) => v + 1)}>Thử lại</button>
        </p>
      )}
      <section className="admin-table-panel">
        <div className="admin-table-title">
          <h2>Danh sách người dùng</h2>
          <span>
            {loading ? 'Đang tải…' : `${number(data.totalElements)} tài khoản`}
          </span>
        </div>
        <div className="admin-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email / tài khoản</th>
                <th>Vai trò</th>
                <th>Ngày tham gia</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="admin-empty">
                    Đang tải người dùng…
                  </td>
                </tr>
              ) : error ? null : data.content.length ? (
                data.content.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-person">
                        <span className="admin-avatar">
                          {(user.fullName || user.email)
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                        <b>
                          {user.fullName || 'Chưa cập nhật'}
                          {user.id === currentUser.id && (
                            <small>Tài khoản của bạn</small>
                          )}
                        </b>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {user.roles.map((r) => (
                        <span key={r} className="admin-badge">
                          {roleLabel(r)}
                        </span>
                      ))}
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <span className={`admin-badge status-${user.status}`}>
                        {statuses[user.status]}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setEditing({ ...user })
                          setModalError('')
                        }}
                      >
                        Xem / chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="admin-empty">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <Pagination
            page={filters.page}
            total={data.totalElements}
            onChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        )}
      </section>
      {editing && (
        <Modal
          title="Thông tin người dùng"
          busy={busy}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <div className="admin-user-details">
              <b>{editing.fullName || 'Chưa cập nhật tên'}</b>
              <p>{editing.email}</p>
              <small>
                Tham gia:{' '}
                {new Date(editing.createdAt).toLocaleDateString('vi-VN')}
              </small>
            </div>
            <fieldset
              disabled={busy || editing.id === currentUser.id || !canAssign}
            >
              <legend>Phân quyền</legend>
              {[...new Set([...roles, ...editing.roles])].map((role) => (
                <label className="admin-checkbox" key={role}>
                  <input
                    type="checkbox"
                    checked={editing.roles.includes(role)}
                    onChange={(e) =>
                      setEditing((u) => ({
                        ...u,
                        roles: e.target.checked
                          ? [...u.roles, role]
                          : u.roles.filter((r) => r !== role),
                      }))
                    }
                  />
                  {roleLabel(role)}
                </label>
              ))}
            </fieldset>
            <label className="admin-field">
              Trạng thái
              <select
                disabled={
                  busy ||
                  !canBan ||
                  editing.id === currentUser.id ||
                  editing.status === 'PENDING_VERIFICATION'
                }
                value={editing.status}
                onChange={(e) =>
                  setEditing((u) => ({ ...u, status: e.target.value }))
                }
              >
                {Object.entries(statuses)
                  .filter(
                    ([key]) =>
                      key !== 'PENDING_VERIFICATION' || editing.status === key,
                  )
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
            {editing.id === currentUser.id && (
              <p className="admin-muted">
                Không thể tự thay đổi quyền hoặc khoá tài khoản đang sử dụng.
              </p>
            )}
            {modalError && (
              <p role="alert" className="admin-error">
                {modalError}
              </p>
            )}
            <div className="admin-modal-actions">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Đóng
              </button>
              <button
                className="admin-primary"
                disabled={
                  busy ||
                  editing.id === currentUser.id ||
                  !editing.roles.length ||
                  (!canAssign && !canBan)
                }
              >
                {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function AcademicManagement({ currentUser }) {
  const [tab, setTab] = useState('faculties')
  const [selectedFaculty, setSelectedFaculty] = useState('')
  return (
    <>
      <div
        className="admin-catalog-tabs"
        role="group"
        aria-label="Danh mục đào tạo"
      >
        <button
          aria-pressed={tab === 'faculties'}
          onClick={() => setTab('faculties')}
        >
          Khoa
        </button>
        <button
          aria-pressed={tab === 'majors'}
          onClick={() => {
            setSelectedFaculty('')
            setTab('majors')
          }}
        >
          Ngành
        </button>
      </div>
      <Catalog
        key={tab}
        currentUser={currentUser}
        type={tab}
        initialFacultyId={selectedFaculty}
        onViewMajors={(id) => {
          setSelectedFaculty(id)
          setTab('majors')
        }}
      />
    </>
  )
}

export default function AdminPages({
  onLogout,
  currentUser,
  authLoading = false,
}) {
  const { section = 'overview' } = useParams()
  const [user, setUser] = useState(currentUser || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (currentUser !== undefined) {
      setUser(currentUser)
      setLoading(authLoading)
      setError(!authLoading && !currentUser ? 'login' : '')
      return
    }
    let active = true
    getCurrentUser()
      .then((r) => {
        if (active) setUser(r.result)
      })
      .catch((e) => {
        if (active) setError(e.status === 401 ? 'login' : e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [currentUser, authLoading])
  if (loading)
    return (
      <main className="admin-access" role="status">
        Đang kiểm tra quyền truy cập…
      </main>
    )
  if (error === 'login') return <Navigate to="/login" replace />
  const isAdmin = user?.roles?.includes('ADMIN')
  const allowed = (key) =>
    hasPermission(user, ...(sectionPermissions[key] || []))
  const visible = Object.entries(sections).filter(([key]) => allowed(key))
  if (error || !visible.length)
    return (
      <main className="admin-access">
        <h1>{error || 'Bạn không có quyền quản trị'}</h1>
        <Link to="/">Về trang chủ</Link>
      </main>
    )
  if (!sections[section] || !allowed(section))
    return (
      <Navigate
        to={visible[0][0] === 'overview' ? '/admin' : '/admin/' + visible[0][0]}
        replace
      />
    )
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin">
          <img src={brandMark} alt="" />
          EduShare <span>ADMIN</span>
        </Link>
        <p className="admin-nav-label">KHÔNG GIAN QUẢN TRỊ</p>
        <nav aria-label="Quản trị">
          {visible.map(([key, label]) => (
            <NavLink
              end={key === 'overview'}
              to={key === 'overview' ? '/admin' : `/admin/${key}`}
              key={key}
            >
              <Icon name={key} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link to="/">
            <Icon name="arrow" />
            Về trang chủ
          </Link>
          <button onClick={onLogout}>Đăng xuất</button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>Admin Workspace</span>
          <div>
            <span className="admin-avatar">
              {(user.fullName || 'A').slice(0, 1)}
            </span>
            <div>
              <b>{user.fullName || 'Quản trị viên'}</b>
              <small>Quản trị hệ thống</small>
            </div>
          </div>
        </header>
        <main className="admin-main">
          <div className="admin-heading">
            <p>QUẢN TRỊ / {sections[section].toLocaleUpperCase('vi')}</p>
            <h1>{sections[section]}</h1>
            <span>
              {section === 'overview'
                ? 'Chào mừng trở lại! Cùng theo dõi hệ thống EduShare.'
                : section === 'users'
                  ? 'Quản lý tài khoản, vai trò và quyền truy cập hệ thống.'
                  : section === 'access'
                    ? 'Quản lý vai trò, cấu hình quyền và phân quyền người dùng.'
                    : 'Quản lý danh mục đào tạo và tổ chức tài liệu học tập.'}
            </span>
          </div>
          {section === 'overview' ? (
            <Overview />
          ) : section === 'users' ? (
            <Users currentUser={user} />
          ) : section === 'access' ? (
            <AdminAccess
              currentUser={user}
              renderUsers={() => <Users currentUser={user} />}
            />
          ) : section === 'faculties' ? (
            <AcademicManagement currentUser={user} />
          ) : (
            <Catalog key={section} type={section} currentUser={user} />
          )}
          <footer className="admin-footer">
            EduShare · Không gian quản trị
          </footer>
        </main>
      </div>
    </div>
  )
}
