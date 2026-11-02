import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, useParams } from 'react-router-dom'
import { getCurrentUser } from '../services/authApi'
import {
  getOverview,
  getRoles,
  getUsers,
  updateUser,
  getCatalog,
  saveCatalog,
  deleteCatalog,
} from '../services/adminApi'
import brandMark from '../assets/brand-mark.svg'
import '../styles/admin.css'

const sections = {
  overview: 'Tổng quan',
  users: 'Quản lý người dùng',
  faculties: 'Khoa & ngành',
  subjects: 'Quản lý môn học',
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

function Modal({ title, children, onClose, busy }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    dialog.showModal()
    return () => {
      dialog.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="admin-modal"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      aria-labelledby="admin-dialog-title"
    >
      <header>
        <h2 id="admin-dialog-title">{title}</h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Đóng"
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  )
}

function Pagination({ page, total, onChange, size = 10 }) {
  const pages = Math.max(1, Math.ceil(total / size))
  return (
    <footer className="admin-pagination">
      <span>
        {total
          ? `${page * size + 1}–${Math.min((page + 1) * size, total)}`
          : '0'}{' '}
        trên {number(total)} kết quả
      </span>
      <div>
        <button disabled={page === 0} onClick={() => onChange(page - 1)}>
          Trước
        </button>
        <span className="admin-page-number">
          {page + 1} / {pages}
        </span>
        <button disabled={page + 1 >= pages} onClick={() => onChange(page + 1)}>
          Tiếp
        </button>
      </div>
    </footer>
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
            <fieldset disabled={busy || editing.id === currentUser.id}>
              <legend>Phân quyền</legend>
              {roles.map((role) => (
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
                  busy || editing.id === currentUser.id || !editing.roles.length
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

function AcademicManagement() {
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

function Catalog({ type, initialFacultyId = '', onViewMajors }) {
  const isSubject = type === 'subjects'
  const isMajor = type === 'majors'
  const hasFaculty = isSubject || isMajor
  const noun = isSubject ? 'môn học' : isMajor ? 'ngành' : 'khoa'
  const [rows, setRows] = useState([])
  const [faculties, setFaculties] = useState([])
  const [query, setQuery] = useState('')
  const [facultyId, setFacultyId] = useState(initialFacultyId)
  const [majorId, setMajorId] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      getCatalog(type),
      hasFaculty ? getCatalog('faculties') : Promise.resolve(null),
    ])
      .then(([r, f]) => {
        if (active) {
          setRows(r.result)
          setFaculties(f?.result || [])
          setError('')
        }
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [type, hasFaculty, reload])
  const filtered = rows.filter(
    (r) =>
      `${r.code} ${r.name}`
        .toLocaleLowerCase('vi')
        .includes(query.toLocaleLowerCase('vi')) &&
      (!facultyId || r.facultyId === facultyId) &&
      (!majorId || r.majorIds?.includes(majorId)),
  )
  const safePage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 10) - 1),
  )
  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setModalError('')
    try {
      await saveCatalog(type, {
        ...editing,
        credits: isSubject ? Number(editing.credits) : null,
      })
      setEditing(null)
      setNotice(`Đã lưu ${noun}.`)
      setReload((v) => v + 1)
    } catch (e) {
      setModalError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    setBusy(true)
    setModalError('')
    try {
      await deleteCatalog(type, deleting.id)
      setDeleting(null)
      setNotice(`Đã xoá ${noun}.`)
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
            aria-label={`Tìm ${noun}`}
            placeholder={`Tìm theo mã hoặc tên ${noun}…`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
          />
        </label>
        {hasFaculty && (
          <select
            aria-label="Lọc khoa"
            value={facultyId}
            onChange={(e) => {
              setFacultyId(e.target.value)
              setPage(0)
            }}
          >
            <option value="">Tất cả các khoa</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
        {isSubject && (
          <select
            aria-label="Lọc ngành sử dụng"
            value={majorId}
            onChange={(e) => {
              setMajorId(e.target.value)
              setPage(0)
            }}
          >
            <option value="">Tất cả ngành sử dụng</option>
            {faculties.map((f) => (
              <optgroup key={f.id} label={f.name}>
                {f.majors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
        <button
          className="admin-primary"
          onClick={() => {
            setEditing({
              code: '',
              name: '',
              description: '',
              facultyId,
              credits: 3,
              majorIds: [],
            })
            setModalError('')
          }}
        >
          ＋ Thêm {noun}
        </button>
      </div>
      {notice && (
        <p role="status" className="admin-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="admin-error">
          {error}{' '}
          <button onClick={() => setReload((v) => v + 1)}>Thử lại</button>
        </p>
      )}
      <section className="admin-table-panel">
        <div className="admin-table-title">
          <h2>Danh sách {noun}</h2>
          <span>
            {number(filtered.length)} {noun}
          </span>
        </div>
        <div className="admin-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã {noun}</th>
                <th>Tên {noun}</th>
                {hasFaculty ? (
                  <>
                    <th>{isSubject ? 'Khoa phụ trách' : 'Khoa quản lý'}</th>
                    <th>{isSubject ? 'Tín chỉ' : 'Mô tả'}</th>
                  </>
                ) : (
                  <>
                    <th>Mô tả</th>
                    <th>Số ngành</th>
                  </>
                )}
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="admin-empty">
                    Đang tải danh mục…
                  </td>
                </tr>
              ) : error ? null : filtered.length ? (
                filtered.slice(safePage * 10, safePage * 10 + 10).map((row) => (
                  <tr key={row.id}>
                    <td className="admin-code">{row.code}</td>
                    <td>
                      <b>{row.name}</b>
                    </td>
                    <td>
                      {hasFaculty ? row.facultyName : row.description || '—'}
                    </td>
                    <td>
                      {isSubject
                        ? row.credits
                        : isMajor
                          ? row.description || '—'
                          : row.majors.length}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        {!hasFaculty && (
                          <button onClick={() => onViewMajors(row.id)}>
                            Xem ngành
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditing({
                              ...row,
                              description: row.description || '',
                            })
                            setModalError('')
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="admin-danger-text"
                          onClick={() => {
                            setDeleting(row)
                            setModalError('')
                          }}
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="admin-empty">
                    {query || facultyId
                      ? 'Không có kết quả phù hợp.'
                      : `Chưa có ${noun}. Thêm ${noun} đầu tiên để bắt đầu.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safePage}
          total={filtered.length}
          onChange={setPage}
        />
      </section>
      {editing && (
        <Modal
          title={`${editing.id ? 'Chỉnh sửa' : 'Thêm'} ${noun}`}
          onClose={() => setEditing(null)}
          busy={busy}
        >
          <form onSubmit={save}>
            <fieldset disabled={busy} className="admin-form-fields">
              <label className="admin-field">
                Mã {noun}
                <input
                  required
                  maxLength="50"
                  value={editing.code}
                  onChange={(e) =>
                    setEditing((v) => ({ ...v, code: e.target.value }))
                  }
                />
              </label>
              <label className="admin-field">
                Tên {noun}
                <input
                  required
                  maxLength="200"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((v) => ({ ...v, name: e.target.value }))
                  }
                />
              </label>
              {hasFaculty && (
                <>
                  <label className="admin-field">
                    Khoa
                    <select
                      required
                      value={editing.facultyId}
                      onChange={(e) =>
                        setEditing((v) => ({
                          ...v,
                          facultyId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Chọn khoa</option>
                      {faculties.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {isSubject && (
                    <>
                      <label className="admin-field">
                        Số tín chỉ
                        <input
                          type="number"
                          required
                          min="1"
                          max="30"
                          value={editing.credits}
                          onChange={(e) =>
                            setEditing((v) => ({
                              ...v,
                              credits: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <fieldset>
                        <legend>Ngành sử dụng môn học (tuỳ chọn)</legend>
                        {faculties
                          .flatMap((f) =>
                            f.majors.map((m) => ({
                              ...m,
                              facultyName: f.name,
                            })),
                          )
                          .map((m) => (
                            <label className="admin-checkbox" key={m.id}>
                              <input
                                type="checkbox"
                                checked={editing.majorIds.includes(m.id)}
                                onChange={(e) =>
                                  setEditing((v) => ({
                                    ...v,
                                    majorIds: e.target.checked
                                      ? [...v.majorIds, m.id]
                                      : v.majorIds.filter((id) => id !== m.id),
                                  }))
                                }
                              />
                              {m.name}{' '}
                              <small className="admin-muted">
                                ({m.facultyName})
                              </small>
                            </label>
                          ))}
                        <small className="admin-muted">
                          Chọn ngành để môn học xuất hiện trong danh mục tải tài
                          liệu của ngành đó.
                        </small>
                      </fieldset>
                    </>
                  )}
                </>
              )}
              <label className="admin-field">
                Mô tả
                <textarea
                  rows="3"
                  maxLength="1000"
                  value={editing.description}
                  onChange={(e) =>
                    setEditing((v) => ({ ...v, description: e.target.value }))
                  }
                />
              </label>
            </fieldset>
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
                Huỷ
              </button>
              <button className="admin-primary" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title={`Xoá ${noun}`}
          busy={busy}
          onClose={() => setDeleting(null)}
        >
          <p>
            Bạn muốn xoá <strong>{deleting.name}</strong> ({deleting.code})?
          </p>
          <p className="admin-muted">Thao tác này không thể hoàn tác.</p>
          {modalError && (
            <p role="alert" className="admin-error">
              {modalError}
            </p>
          )}
          <div className="admin-modal-actions">
            <button disabled={busy} onClick={() => setDeleting(null)}>
              Huỷ
            </button>
            <button className="admin-danger" disabled={busy} onClick={remove}>
              {busy ? 'Đang xoá…' : 'Xác nhận xoá'}
            </button>
          </div>
        </Modal>
      )}
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
  if (error || !user?.roles?.includes('ADMIN'))
    return (
      <main className="admin-access">
        <h1>{error || 'Bạn không có quyền quản trị'}</h1>
        <Link to="/">Về trang chủ</Link>
      </main>
    )
  if (!sections[section]) return <Navigate to="/admin" replace />
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin">
          <img src={brandMark} alt="" />
          EduShare <span>ADMIN</span>
        </Link>
        <p className="admin-nav-label">KHÔNG GIAN QUẢN TRỊ</p>
        <nav aria-label="Quản trị">
          {Object.entries(sections).map(([key, label]) => (
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
                  : 'Quản lý danh mục đào tạo và tổ chức tài liệu học tập.'}
            </span>
          </div>
          {section === 'overview' ? (
            <Overview />
          ) : section === 'users' ? (
            <Users currentUser={user} />
          ) : section === 'faculties' ? (
            <AcademicManagement />
          ) : (
            <Catalog key={section} type={section} />
          )}
          <footer className="admin-footer">
            EduShare · Không gian quản trị
          </footer>
        </main>
      </div>
    </div>
  )
}
