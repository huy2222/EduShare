import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DocumentPagination } from '../components/DocumentCards'
import { formatDocumentNumber, formatDocumentSize } from '../services/documentDisplay'
import { downloadPublishedDocument, getFavoriteDocuments, setDocumentFavorite } from '../services/libraryApi'
import { ProfileIcon, ProfileShell } from './ProfilePages'
import '../styles/settings-favorites.css'

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

export function FavoriteDocumentsPage({ authenticated = false, authLoading = false, onLogout = () => {} }) {
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!authenticated) return
    let active = true
    getFavoriteDocuments(query, page)
      .then(({ result }) => {
        if (!active) return
        if (!result.items.length && page > 0) {
          setPage(page - 1)
        } else {
          setData(result)
        }
      })
      .catch((error) => { if (active) setLoadError(error.message) })
    return () => { active = false }
  }, [authenticated, query, page, revision])

  async function act(id, operation) {
    if (busy) return
    setBusy(id)
    setActionError('')
    try {
      await operation()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusy(null)
    }
  }

  function removeFavorite(id) {
    act(id, async () => {
      await setDocumentFavorite(id, false)
      setData(null)
      setRevision((value) => value + 1)
    })
  }

  return (
    <ProfileShell activeSidebar="favorites" authenticated={authenticated} onLogout={onLogout}>
      <div className="favorites-heading">
        <div>
          <p>THƯ VIỆN CÁ NHÂN {authenticated && data && !query && <small> · {data.total} tài liệu đã lưu</small>}</p>
          <h1>Tài liệu yêu thích</h1>
        </div>
      </div>
      {authenticated && (
        <form className="favorites-toolbar" role="search" onSubmit={(event) => {
          event.preventDefault()
          const nextQuery = searchInput.trim()
          if (nextQuery === query || busy) return
          setData(null)
          setLoadError('')
          setActionError('')
          setPage(0)
          setQuery(nextQuery)
        }}>
          <label>
            <span aria-hidden="true">⌕</span>
            <input aria-label="Tìm kiếm tài liệu yêu thích" placeholder="Tìm kiếm tài liệu yêu thích..."
              type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </label>
          <button type="submit" disabled={Boolean(busy)}>Tìm kiếm</button>
        </form>
      )}
      {authLoading ? <p role="status">Đang kiểm tra đăng nhập…</p> : !authenticated ? (
        <p><Link to="/login" state={{ returnTo: '/favorites' }}>Đăng nhập để xem tài liệu đã lưu</Link></p>
      ) : loadError ? (
        <p role="alert">{loadError} <button type="button" onClick={() => {
          setLoadError('')
          setRevision((value) => value + 1)
        }}>Thử lại</button></p>
      ) : !data ? <p role="status">Đang tải tài liệu yêu thích…</p> : (
        <>
          {actionError && <p role="alert">{actionError}</p>}
          <section className="favorite-grid" aria-label="Danh sách tài liệu yêu thích">
            {data.items.map((document) => (
              <article className="favorite-card" key={document.id}>
                <div className="favorite-card__summary favorite-card__summary--blue">
                  <span className="favorite-card__category">Đã duyệt</span>
                  <button aria-label={`Bỏ lưu ${document.title}`} disabled={Boolean(busy)} onClick={() => removeFavorite(document.id)} type="button">♥</button>
                  <span className="favorite-card__file-icon"><ProfileIcon name="file" size={34} /></span>
                  <strong>{document.fileType}</strong>
                  <p>{formatDocumentSize(document.fileSize)}</p>
                </div>
                <div className="favorite-card__body">
                  <p className="favorite-card__subject"><b>{document.subjectCode}</b>{document.subjectName}</p>
                  <h3>{document.title}</h3>
                  <p className="favorite-card__description">{document.description}</p>
                  <div className="favorite-card__author">
                    <span>{document.author.slice(0, 1)}</span>
                    <div><strong>{document.author}</strong><small>★ {formatDocumentNumber(document.averageRating)}/5 · {formatDocumentNumber(document.downloads)} lượt tải</small></div>
                  </div>
                  <footer>
                    <Link to={`/documents/${document.id}`}>Xem chi tiết</Link>
                    <button type="button" disabled={Boolean(busy)} onClick={() => act(document.id, () => downloadPublishedDocument(document.id, document.fileName))}>
                      <ProfileIcon name="download" size={15} /> Tải xuống
                    </button>
                  </footer>
                </div>
              </article>
            ))}
            {data.items.length === 0 && (
              <p className="favorites-empty">
                {query ? 'Không tìm thấy tài liệu yêu thích phù hợp.' : 'Bạn chưa lưu tài liệu nào.'}
              </p>
            )}
          </section>
          <DocumentPagination page={page} hasNext={data.hasNext} busy={Boolean(busy)} onChange={(nextPage) => {
            setActionError('')
            setData(null)
            setPage(nextPage)
          }} />
        </>
      )}
    </ProfileShell>
  )
}
