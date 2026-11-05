import { hasPermission } from '../services/adminAccess'
import { useEffect, useState } from 'react'
import {
  getCatalog,
  getCatalogDetail,
  saveCatalog,
  deleteCatalog,
} from '../services/adminApi'
import { Modal, Pagination } from './AdminUi'

// Options are searched and paginated independently from table data.
function OptionPicker({
  type,
  label,
  value,
  onChange,
  multiple = false,
  selected = [],
  disabled = false,
}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], totalElements: 0 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    const timer = setTimeout(
      () =>
        getCatalog(type, { search, page, size: 10, options: true })
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
      search ? 250 : 0,
    )
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [type, search, page, retry])
  const choices = [...selected, ...data.items].filter(
    (row, index, all) => all.findIndex((r) => r.id === row.id) === index,
  )
  return (
    <fieldset disabled={disabled} className="admin-option-picker">
      <legend>{label}</legend>
      <input
        aria-label={`Tìm ${label}`}
        placeholder="Tìm theo mã hoặc tên…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(0)
        }}
      />
      {error && (
        <p role="alert">
          {error}{' '}
          <button type="button" onClick={() => setRetry((n) => n + 1)}>
            Thử lại
          </button>
        </p>
      )}
      {loading && <small role="status">Đang tải lựa chọn…</small>}
      {multiple ? (
        <>
          {choices.map((row) => (
            <label key={row.id} className="admin-checkbox">
              <input
                type="checkbox"
                checked={value.includes(row.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, row]
                      : selected.filter((r) => r.id !== row.id),
                  )
                }
              />
              {row.name} {row.facultyName && <small>({row.facultyName})</small>}
            </label>
          ))}
          {!loading && !choices.length && <small>Không có kết quả.</small>}
        </>
      ) : (
        <select
          aria-label={label}
          value={value || ''}
          onChange={(e) =>
            onChange(choices.find((r) => r.id === e.target.value) || null)
          }
        >
          <option value="">Chọn {label.toLowerCase()}</option>
          {choices.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      )}
      <div className="admin-option-pages">
        <button
          type="button"
          disabled={loading || page === 0}
          onClick={() => setPage((n) => n - 1)}
        >
          Trước
        </button>
        <small>Trang {page + 1}</small>
        <button
          type="button"
          disabled={loading || (page + 1) * 10 >= data.totalElements}
          onClick={() => setPage((n) => n + 1)}
        >
          Tiếp
        </button>
      </div>
    </fieldset>
  )
}

export default function Catalog({
  type,
  initialFacultyId = '',
  onViewMajors,
  currentUser = { roles: ['ADMIN'] },
}) {
  const prefix = { faculties: 'FACULTY', majors: 'MAJOR', subjects: 'SUBJECT' }[
    type
  ]
  const canCreate = hasPermission(
    currentUser,
    'CATALOG_MANAGE',
    prefix + '_CREATE',
  )
  const canUpdate = hasPermission(
    currentUser,
    'CATALOG_MANAGE',
    prefix + '_UPDATE',
  )
  const canDelete = hasPermission(
    currentUser,
    'CATALOG_MANAGE',
    prefix + '_DELETE',
  )
  const isSubject = type === 'subjects'
  const hasFaculty = type !== 'faculties'
  const noun = isSubject ? 'môn học' : type === 'majors' ? 'ngành' : 'khoa'
  const [search, setSearch] = useState('')
  const [faculty, setFaculty] = useState(
    initialFacultyId ? { id: initialFacultyId, name: 'Khoa đã chọn' } : null,
  )
  const [major, setMajor] = useState(null)
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], totalElements: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState('')
  const [reload, setReload] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  useEffect(() => {
    let active = true
    setLoading(true)
    const timer = setTimeout(
      () =>
        getCatalog(type, {
          search,
          facultyId: faculty?.id || '',
          majorId: major?.id || '',
          page,
          size: 10,
        })
          .then((r) => {
            if (active) {
              if (!r.result.items.length && page > 0) {
                setPage(Math.max(0, Math.ceil(r.result.totalElements / 10) - 1))
                return
              }
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
      search ? 250 : 0,
    )
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [type, search, faculty?.id, major?.id, page, reload])
  const edit = async (row) => {
    setBusy(true)
    setError('')
    try {
      const r = await getCatalogDetail(type, row.id)
      setEditing({
        ...r.result,
        description: r.result.description || '',
        majors: r.result.majors || [],
      })
      setModalError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setModalError('')
    try {
      await saveCatalog(type, {
        id: editing.id,
        code: editing.code,
        name: editing.name,
        description: editing.description,
        facultyId: editing.facultyId,
        credits: isSubject ? Number(editing.credits) : null,
        majorIds: editing.majors.map((m) => m.id),
      })
      setEditing(null)
      setNotice(`Đã lưu ${noun}.`)
      setReload((n) => n + 1)
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
      setReload((n) => n + 1)
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
          <input
            aria-label={`Tìm ${noun}`}
            placeholder={`Tìm theo mã hoặc tên ${noun}…`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
          />
        </label>
        {hasFaculty && (
          <button onClick={() => setShowFilters((v) => !v)}>Bộ lọc</button>
        )}
        <button
          onClick={() => {
            setSearch('')
            setFaculty(null)
            setMajor(null)
            setPage(0)
          }}
        >
          Đặt lại
        </button>
        <button
          className="admin-primary"
          disabled={busy || !canCreate}
          onClick={() => {
            setEditing({
              code: '',
              name: '',
              description: '',
              facultyId: faculty?.id || '',
              facultyName: faculty?.name || '',
              credits: 3,
              majors: [],
            })
            setModalError('')
          }}
        >
          ＋ Thêm {noun}
        </button>
      </div>
      {showFilters && (
        <div className="admin-filter-options">
          <OptionPicker
            type="faculties"
            label="Lọc khoa"
            value={faculty?.id}
            selected={faculty ? [faculty] : []}
            onChange={(f) => {
              setFaculty(f)
              setPage(0)
            }}
          />
          {isSubject && (
            <OptionPicker
              type="majors"
              label="Lọc ngành sử dụng"
              value={major?.id}
              selected={major ? [major] : []}
              onChange={(m) => {
                setMajor(m)
                setPage(0)
              }}
            />
          )}
        </div>
      )}
      {notice && (
        <p role="status" className="admin-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="admin-error">
          {error}{' '}
          <button onClick={() => setReload((n) => n + 1)}>Thử lại</button>
        </p>
      )}
      <section className="admin-table-panel">
        <div className="admin-table-title">
          <h2>Danh sách {noun}</h2>
          <span>{loading ? 'Đang tải…' : `${data.totalElements} ${noun}`}</span>
        </div>
        <div className="admin-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã {noun}</th>
                <th>Tên {noun}</th>
                <th>{hasFaculty ? 'Khoa' : 'Mô tả'}</th>
                <th>
                  {isSubject ? 'Tín chỉ' : hasFaculty ? 'Mô tả' : 'Số ngành'}
                </th>
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
              ) : error ? null : data.items.length ? (
                data.items.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-code">{row.code}</td>
                    <td>
                      <b>{row.name}</b>
                    </td>
                    <td>
                      {hasFaculty
                        ? row.facultyName || 'Chưa phân khoa'
                        : row.description || '—'}
                    </td>
                    <td>
                      {isSubject
                        ? row.credits
                        : hasFaculty
                          ? row.description || '—'
                          : row.majorCount}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        {!hasFaculty && (
                          <button onClick={() => onViewMajors(row.id)}>
                            Xem ngành
                          </button>
                        )}
                        <button
                          disabled={busy || !canUpdate}
                          onClick={() => edit(row)}
                        >
                          Sửa
                        </button>
                        <button
                          disabled={busy || !canDelete}
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
                    Không có kết quả phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && !error && (
          <Pagination
            page={page}
            total={data.totalElements}
            onChange={setPage}
          />
        )}
      </section>
      {editing && (
        <Modal
          title={`${editing.id ? 'Chỉnh sửa' : 'Thêm'} ${noun}`}
          busy={busy}
          onClose={() => setEditing(null)}
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
                <OptionPicker
                  type="faculties"
                  label="Khoa"
                  value={editing.facultyId}
                  selected={
                    editing.facultyId
                      ? [
                          {
                            id: editing.facultyId,
                            name: editing.facultyName || 'Khoa đã chọn',
                          },
                        ]
                      : []
                  }
                  onChange={(f) =>
                    setEditing((v) => ({
                      ...v,
                      facultyId: f?.id || '',
                      facultyName: f?.name || '',
                    }))
                  }
                />
              )}
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
                        setEditing((v) => ({ ...v, credits: e.target.value }))
                      }
                    />
                  </label>
                  <OptionPicker
                    type="majors"
                    label="Ngành sử dụng môn học"
                    multiple
                    value={editing.majors.map((m) => m.id)}
                    selected={editing.majors}
                    onChange={(majors) => setEditing((v) => ({ ...v, majors }))}
                  />
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
              <button
                className="admin-primary"
                disabled={busy || (hasFaculty && !editing.facultyId)}
              >
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
          <p>Thao tác này không thể hoàn tác.</p>
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
              Xác nhận xoá
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
