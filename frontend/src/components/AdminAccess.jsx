import { hasPermission } from '../services/adminAccess'
import { useEffect, useState } from 'react'
import { Modal, Pagination } from './AdminUi'
import {
  listManagedRoles,
  listManagedPermissions,
  getManagedRole,
  saveManagedRole,
  configureManagedRole,
  deleteManagedRole,
} from '../services/accessApi'

const systemRole = (role) => ['ADMIN', 'USER'].includes(role.code)
const label = (role) =>
  role.displayName ||
  { ADMIN: 'Quản trị viên', USER: 'Người dùng', MODERATOR: 'Kiểm duyệt viên' }[
    role.code
  ] ||
  role.code

export default function AdminAccess({
  renderUsers,
  currentUser = { roles: ['ADMIN'] },
}) {
  const canCreate = hasPermission(currentUser, 'ACCESS_ROLE_CREATE')
  const canUpdate = hasPermission(currentUser, 'ACCESS_ROLE_UPDATE')
  const canDelete = hasPermission(currentUser, 'ACCESS_ROLE_DELETE')
  const canConfigure = hasPermission(currentUser, 'PERMISSION_MANAGE')
  const [tab, setTab] = useState('roles')
  const [data, setData] = useState({ items: [], totalElements: 0 })
  const [permissions, setPermissions] = useState([])
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null)
  const [config, setConfig] = useState(null)
  const [selected, setSelected] = useState([])
  const [permissionSearch, setPermissionSearch] = useState('')
  const [group, setGroup] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState('')
  useEffect(() => {
    let active = true
    if (tab !== 'roles' || config) return
    setLoading(true)
    const timer = setTimeout(
      () =>
        Promise.all([listManagedRoles(search, page), listManagedPermissions()])
          .then(([r, p]) => {
            if (active) {
              if (!r.result.items.length && page > 0) {
                setPage(Math.max(0, Math.ceil(r.result.totalElements / 10) - 1))
                return
              }
              setData(r.result)
              setPermissions(p.result)
              setError('')
            }
          })
          .catch((e) => {
            if (active) setError(e.message)
          })
          .finally(() => {
            if (active) setLoading(false)
          }),
      search ? 250 : 0,
    )
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [tab, page, search, reload, config])
  const openRole = async (role, configure) => {
    setBusy(true)
    setError('')
    try {
      const r = await getManagedRole(role.id)
      if (configure) {
        setConfig(r.result)
        setSelected(r.result.permissions)
        setPermissionSearch('')
        setGroup('')
      } else {
        setEditing({
          ...r.result,
          displayName: label(r.result),
          description: r.result.description || '',
        })
        setModalError('')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setModalError('')
    try {
      await saveManagedRole(editing)
      setEditing(null)
      setNotice('Đã lưu vai trò.')
      setReload((n) => n + 1)
    } catch (e) {
      setModalError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const dirty =
    config &&
    (selected.length !== config.permissions.length ||
      selected.some((code) => !config.permissions.includes(code)))
  const leaveConfig = () => {
    if (!dirty || window.confirm('Bạn có muốn bỏ các thay đổi quyền chưa lưu?'))
      setConfig(null)
  }
  const shown = permissions.filter(
    (p) =>
      (!group || p.group === group) &&
      `${p.name} ${p.code} ${p.description}`
        .toLocaleLowerCase('vi')
        .includes(permissionSearch.toLocaleLowerCase('vi')),
  )
  const availableCount = permissions.filter((p) => p.available !== false).length
  const groups = [...new Set(permissions.map((p) => p.group))]
  const toggleGroup = (groupItems) => {
    const items = groupItems.filter((p) => p.available !== false)
    return
    setSelected((old) =>
      items.every((p) => old.includes(p.code))
        ? old.filter((code) => !items.some((p) => p.code === code))
        : [...new Set([...old, ...items.map((p) => p.code)])],
    )
  }
  if (config)
    return (
      <>
        <div className="admin-table-title">
          <div>
            <h2>Cấu hình quyền: {label(config)}</h2>
            <p className="admin-muted">
              <code>{config.code}</code> ·{' '}
              {config.active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
            </p>
          </div>
          <button disabled={busy} onClick={leaveConfig}>
            ← Danh sách vai trò
          </button>
        </div>
        {(config.code === 'ADMIN' || !canConfigure) && (
          <p className="admin-access-info">
            Vai trò hệ thống được bảo vệ. ADMIN có toàn quyền; USER giữ quyền sử
            dụng cơ bản.
          </p>
        )}
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        <div className="admin-toolbar">
          <label className="admin-search">
            <input
              aria-label="Tìm quyền"
              placeholder="Tìm tên hoặc mã quyền…"
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Nhóm quyền"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="">Tất cả nhóm</option>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <button
            disabled={busy || config.code === 'ADMIN' || !canConfigure}
            onClick={() =>
              setSelected((old) => [
                ...new Set([
                  ...old,
                  ...shown
                    .filter((p) => p.available !== false)
                    .map((p) => p.code),
                ]),
              ])
            }
          >
            Chọn quyền đang hiển thị
          </button>
          <button
            disabled={busy || config.code === 'ADMIN' || !canConfigure}
            onClick={() =>
              setSelected((old) =>
                old.filter((code) => !shown.some((p) => p.code === code)),
              )
            }
          >
            Bỏ chọn
          </button>
        </div>
        <section className="admin-table-panel">
          {groups
            .filter((g) => shown.some((p) => p.group === g))
            .map((g) => {
              const items = shown.filter((p) => p.group === g)
              return (
                <section className="admin-permission-group" key={g}>
                  <header>
                    <h3>
                      {g}{' '}
                      <small>
                        {items.filter((p) => selected.includes(p.code)).length}/
                        {items.length} đã chọn
                      </small>
                    </h3>
                    <button
                      disabled={
                        busy ||
                        !items.some((p) => p.available !== false) ||
                        config.code === 'ADMIN' ||
                        !canConfigure
                      }
                      onClick={() => toggleGroup(items)}
                    >
                      Chọn / bỏ cả nhóm
                    </button>
                  </header>
                  {items.map((p) => (
                    <label className="admin-permission-row" key={p.code}>
                      <input
                        type="checkbox"
                        disabled={
                          busy ||
                          p.available === false ||
                          config.code === 'ADMIN' ||
                          !canConfigure
                        }
                        checked={selected.includes(p.code)}
                        onChange={(e) =>
                          setSelected((old) =>
                            e.target.checked
                              ? [...old, p.code]
                              : old.filter((code) => code !== p.code),
                          )
                        }
                      />
                      <span>
                        <b>
                          {p.name}{' '}
                          {p.available === false && (
                            <span className="admin-badge">Chưa triển khai</span>
                          )}
                        </b>
                        <small>{p.description}</small>
                      </span>
                      <code>{p.code}</code>
                    </label>
                  ))}
                </section>
              )
            })}
          {!shown.length && (
            <p className="admin-empty">Không có quyền phù hợp.</p>
          )}
        </section>
        <div className="admin-permission-save">
          <span>
            {
              selected.filter((code) =>
                permissions.some(
                  (p) => p.available !== false && p.code === code,
                ),
              ).length
            }
            /{permissions.length} quyền ·{' '}
            {dirty ? 'Chưa lưu thay đổi' : 'Đã đồng bộ'}
          </span>
          <div>
            <button
              disabled={busy || !dirty}
              onClick={() => setSelected(config.permissions)}
            >
              Đặt lại
            </button>
            <button
              className="admin-primary"
              disabled={
                busy || !dirty || config.code === 'ADMIN' || !canConfigure
              }
              onClick={async () => {
                setBusy(true)
                setError('')
                try {
                  const r = await configureManagedRole(config.id, selected)
                  setConfig(r.result)
                  setSelected(r.result.permissions)
                  setNotice('Đã cập nhật quyền. Áp dụng từ yêu cầu tiếp theo.')
                } catch (e) {
                  setError(e.message)
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
        {notice && (
          <p role="status" className="admin-success">
            {notice}
          </p>
        )}
      </>
    )
  return (
    <>
      <div className="admin-catalog-tabs" role="group" aria-label="Phân quyền">
        <button aria-pressed={tab === 'roles'} onClick={() => setTab('roles')}>
          Quản lý vai trò
        </button>
        <button
          disabled={!hasPermission(currentUser, 'USER_VIEW')}
          aria-pressed={tab === 'users'}
          onClick={() => setTab('users')}
        >
          Phân quyền người dùng
        </button>
      </div>
      {tab === 'users' ? (
        renderUsers()
      ) : (
        <>
          <div className="admin-toolbar">
            <label className="admin-search">
              <input
                aria-label="Tìm vai trò"
                placeholder="Tìm tên hoặc mã vai trò…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </label>
            <button
              className="admin-primary"
              disabled={!canCreate}
              onClick={() => {
                setEditing({
                  code: '',
                  displayName: '',
                  description: '',
                  active: true,
                })
                setModalError('')
              }}
            >
              ＋ Tạo vai trò
            </button>
          </div>
          {error && (
            <p role="alert" className="admin-error">
              {error}{' '}
              <button onClick={() => setReload((n) => n + 1)}>Thử lại</button>
            </p>
          )}
          {notice && (
            <p role="status" className="admin-success">
              {notice}
            </p>
          )}
          {loading ? (
            <p role="status">Đang tải vai trò…</p>
          ) : (
            <>
              <div className="admin-role-grid">
                {data.items.map((role) => {
                  const count =
                    role.code === 'ADMIN'
                      ? permissions.length
                      : role.permissionCount
                  return (
                    <article className="admin-role-card" key={role.id}>
                      <header>
                        <span className="admin-stat-icon">♢</span>
                        <div>
                          <h2>{label(role)}</h2>
                          <code>{role.code}</code>
                        </div>
                        <span
                          className={`admin-badge status-${role.active ? 'ACTIVE' : 'INACTIVE'}`}
                        >
                          {role.active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </header>
                      <p>{role.description || 'Chưa có mô tả vai trò.'}</p>
                      <div className="admin-role-summary">
                        <div>
                          <span>Phạm vi quyền hạn</span>
                          <b>{count} quyền</b>
                        </div>
                        <div className="admin-progress">
                          <span
                            style={{
                              width: `${permissions.length ? Math.min(100, (count / permissions.length) * 100) : 0}%`,
                            }}
                          />
                        </div>
                        <div>
                          <span>Quy mô áp dụng</span>
                          <b>
                            {role.userCount.toLocaleString('vi-VN')} tài khoản
                          </b>
                        </div>
                      </div>
                      <footer>
                        {systemRole(role) ? (
                          <small>Vai trò hệ thống</small>
                        ) : (
                          <>
                            <button
                              disabled={busy || !canUpdate}
                              onClick={() => openRole(role, false)}
                            >
                              Sửa
                            </button>
                            <button
                              className="admin-danger-text"
                              disabled={busy || !canDelete}
                              onClick={() => {
                                setDeleting(role)
                                setModalError('')
                              }}
                            >
                              Xoá
                            </button>
                          </>
                        )}
                        <button
                          className="admin-primary"
                          disabled={busy}
                          onClick={() => openRole(role, true)}
                        >
                          {role.code === 'ADMIN' || !canConfigure
                            ? 'Xem quyền'
                            : 'Điều chỉnh quyền'}
                        </button>
                      </footer>
                    </article>
                  )
                })}
              </div>
              {!data.items.length && (
                <p className="admin-empty">Không tìm thấy vai trò.</p>
              )}
              <Pagination
                page={page}
                total={data.totalElements}
                onChange={setPage}
              />
            </>
          )}
          <p className="admin-access-info">
            Thay đổi quyền và trạng thái vai trò có hiệu lực từ yêu cầu tiếp
            theo. Vai trò ngừng hoạt động được giữ trên tài khoản nhưng không
            cấp quyền. Quản lý vai trò tuân theo các quyền được cấp. Chỉ ADMIN
            thay đổi tài khoản ADMIN.
          </p>
        </>
      )}
      {editing && (
        <Modal
          title={editing.id ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
          busy={busy}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <fieldset disabled={busy} className="admin-form-fields">
              <label className="admin-field">
                Tên vai trò
                <input
                  required
                  maxLength="100"
                  value={editing.displayName}
                  onChange={(e) =>
                    setEditing((v) => ({ ...v, displayName: e.target.value }))
                  }
                />
              </label>
              <label className="admin-field">
                Mã vai trò
                <input
                  required
                  pattern="[A-Z][A-Z0-9_]{1,99}"
                  maxLength="100"
                  disabled={!!editing.id}
                  placeholder="TEACHER_ASSISTANT"
                  value={editing.code}
                  onChange={(e) =>
                    setEditing((v) => ({
                      ...v,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                />
                <small>
                  Chữ in hoa, số, dấu gạch dưới. Mã cố định sau khi tạo.
                </small>
              </label>
              <label className="admin-field">
                Mô tả vai trò
                <textarea
                  maxLength="500"
                  rows="3"
                  value={editing.description}
                  onChange={(e) =>
                    setEditing((v) => ({ ...v, description: e.target.value }))
                  }
                />
              </label>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) =>
                    setEditing((v) => ({ ...v, active: e.target.checked }))
                  }
                />
                Kích hoạt vai trò
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
                {busy ? 'Đang lưu…' : 'Lưu vai trò'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Xoá vai trò"
          busy={busy}
          onClose={() => setDeleting(null)}
        >
          <p>
            Xoá vai trò <b>{label(deleting)}</b>? Chỉ có thể xoá vai trò chưa
            được gán cho tài khoản.
          </p>
          {modalError && (
            <p role="alert" className="admin-error">
              {modalError}
            </p>
          )}
          <div className="admin-modal-actions">
            <button disabled={busy} onClick={() => setDeleting(null)}>
              Huỷ
            </button>
            <button
              className="admin-danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setModalError('')
                try {
                  await deleteManagedRole(deleting.id)
                  setDeleting(null)
                  setNotice('Đã xoá vai trò.')
                  setReload((n) => n + 1)
                } catch (e) {
                  setModalError(e.message)
                } finally {
                  setBusy(false)
                }
              }}
            >
              Xác nhận xoá
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
