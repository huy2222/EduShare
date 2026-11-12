import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DocumentComments from '../components/DocumentComments'
import DocumentPreview from '../components/DocumentPreview'
import { formatDocumentDate, formatDocumentNumber, formatDocumentSize } from '../services/documentDisplay'
import {
  downloadPublishedDocument,
  getDocumentViewer,
  getPublishedDocument,
  rateDocument,
  setDocumentFavorite,
} from '../services/libraryApi'
import { HomeHeader } from './HomePage'
import '../styles/document-detail.css'

const stars = [5, 4, 3, 2, 1, 0]

function Ratings({ summary, authenticated, value, onChange, onSubmit, busy, loginLink }) {
  return (
    <section className="reader-panel">
      <h2>Đánh giá</h2>
      <div className="reader-rating-summary">
        <div className="reader-rating-score">
          <strong>{summary.total ? `${formatDocumentNumber(summary.average)}/5` : '—'}</strong>
          <span aria-hidden="true">★★★★★</span>
          <small>{formatDocumentNumber(summary.total)} lượt đánh giá</small>
        </div>
        <ul className="reader-rating-breakdown">
          {stars.map((star) => (
            <li key={star}>
              <span>{star} sao</span>
              <progress max={summary.total || 1} value={summary.counts[star]} aria-label={`Tỷ lệ đánh giá ${star} sao`} />
              <span>{formatDocumentNumber(summary.counts[star])}</span>
            </li>
          ))}
        </ul>
      </div>
      {authenticated ? (
        <form className="reader-rate-form" onSubmit={onSubmit}>
          <fieldset disabled={busy}>
            <legend>Đánh giá của bạn</legend>
            {[...stars].reverse().map((star) => (
              <label key={star} className={value === star ? 'reader-star--selected' : ''}>
                <input type="radio" name="rating" value={star} checked={value === star} onChange={() => onChange(star)} />
                {star === 0 ? '0 sao' : `${star} ★`}
              </label>
            ))}
          </fieldset>
          <button className="reader-button reader-button--primary" disabled={busy || value === null}>Gửi đánh giá</button>
        </form>
      ) : <p>{loginLink('Đăng nhập để đánh giá')}</p>}
    </section>
  )
}

function DocumentDetail({ id, authenticated, currentUser, onLogout }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(0)
  const [viewer, setViewer] = useState(null)
  const [viewerError, setViewerError] = useState('')
  const [viewerRetry, setViewerRetry] = useState(0)
  const [selectedRating, setSelectedRating] = useState(null)
  const [pending, setPending] = useState('')
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    let active = true
    getPublishedDocument(id)
      .then(({ result }) => { if (active) setDetail(result) })
      .catch((err) => { if (active) setError(err) })
    return () => { active = false }
  }, [id, retry])

  const loaded = detail !== null
  useEffect(() => {
    setViewer(null)
    setViewerError('')
    setSelectedRating(null)
    if (!authenticated || !loaded) return
    let active = true
    getDocumentViewer(id)
      .then(({ result }) => {
        if (!active) return
        setViewer(result)
        setSelectedRating(result.rating)
      })
      .catch((err) => { if (active) setViewerError(err.message) })
    return () => { active = false }
  }, [authenticated, currentUser?.id, id, loaded, viewerRetry])

  const loginLink = (label, className) => (
    <Link className={className} to="/login" state={{ returnTo: `/documents/${id}` }}>{label}</Link>
  )

  async function run(action, operation, message) {
    if (pending) return
    setPending(action)
    setFeedback(null)
    try {
      await operation()
      if (message) setFeedback({ message })
    } catch (err) {
      setFeedback({ message: err.message, error: true })
    } finally {
      setPending('')
    }
  }

  function submitRating(event) {
    event.preventDefault()
    if (!viewer || selectedRating === null) return
    run('rating', async () => {
      const { result } = await rateDocument(id, selectedRating)
      setDetail((previous) => ({ ...previous, ratings: result }))
      setViewer((previous) => previous && { ...previous, rating: selectedRating })
    }, 'Đã lưu đánh giá của bạn.')
  }

  const document = detail?.document
  return (
    <div className="home-page document-reader">
      <HomeHeader
        authenticated={authenticated}
        currentUser={currentUser}
        onLogout={onLogout}
        searchInput={search}
        onSearchChange={(event) => setSearch(event.target.value)}
        onSearchSubmit={(event) => {
          event.preventDefault()
          navigate(`/explore?${new URLSearchParams({ query: search.trim() })}`)
        }}
      />
      <main className="reader-main">
        <nav className="reader-breadcrumb" aria-label="Đường dẫn">
          <Link to="/">Trang chủ</Link><span aria-hidden="true">›</span><Link to="/explore">Khám phá tài liệu</Link>
          {document && <><span aria-hidden="true">›</span><span aria-current="page">{document.title}</span></>}
        </nav>
        {error ? (
          <p className="reader-panel" role="alert">
            {error.status === 404 ? 'Tài liệu không tồn tại hoặc đã ngừng hiển thị.' : error.message}
            {error.status !== 404 && <button type="button" onClick={() => {
              setError(null)
              setRetry((value) => value + 1)
            }}>Thử lại</button>}
          </p>
        ) : !document ? <p className="reader-panel" role="status">Đang tải tài liệu…</p> : (
          <>
            <section className="reader-panel reader-hero">
              <div>
                <div className="reader-tags">
                  <Link to={`/explore?${new URLSearchParams({ query: document.subjectCode })}`}>{document.subjectName} ({document.subjectCode})</Link>
                  <span>{document.fileType}</span><span className="reader-approved">✓ Đã duyệt</span>
                </div>
                <h1>{document.title}</h1>
                <p className="reader-byline">
                  <span className="reader-avatar" aria-hidden="true">{document.author.slice(0, 1)}</span>
                  <strong>{document.author}</strong>
                  <time dateTime={document.createdAt}>{formatDocumentDate(document.createdAt)}</time>
                  <span>{formatDocumentSize(document.fileSize)}</span>
                </p>
                <div className="reader-metrics">
                  <span>{formatDocumentNumber(document.downloads)} lượt tải</span>
                  <span>{formatDocumentNumber(document.views)} lượt xem</span>
                  <span><b aria-hidden="true">★</b> {formatDocumentNumber(detail.ratings.average)}/5 ({detail.ratings.total} đánh giá)</span>
                </div>
              </div>
              <div className="reader-actions">
                <button type="button" className="reader-button reader-button--primary" disabled={Boolean(pending)}
                  onClick={() => run('download', async () => {
                    await downloadPublishedDocument(id, document.fileName)
                    setDetail((previous) => ({
                      ...previous,
                      document: { ...previous.document, downloads: previous.document.downloads + 1 },
                    }))
                  })}>
                  {pending === 'download' ? 'Đang tải…' : `↓ Tải về (${formatDocumentSize(document.fileSize)})`}
                </button>
                {authenticated ? (
                  <button type="button" className="reader-button" disabled={!viewer || Boolean(pending)} aria-pressed={viewer?.favorite ?? false}
                    onClick={() => run('favorite', async () => {
                      const favorite = !viewer.favorite
                      await setDocumentFavorite(id, favorite)
                      setViewer((previous) => previous && { ...previous, favorite })
                    }, viewer?.favorite ? 'Đã bỏ yêu thích.' : 'Đã thêm vào yêu thích.')}>
                    {viewer?.favorite ? '♥ Đã yêu thích' : '♡ Thêm vào yêu thích'}
                  </button>
                ) : loginLink('♡ Đăng nhập để lưu', 'reader-button')}
                {viewerError && <small role="alert">{viewerError} <button type="button" onClick={() => setViewerRetry((value) => value + 1)}>Thử lại</button></small>}
                {feedback && <small role={feedback.error ? 'alert' : 'status'}>{feedback.message}</small>}
              </div>
            </section>
            <div className="reader-columns">
              <div className="reader-content">
                <DocumentPreview documentId={id} available={detail.previewAvailable} />
                <Ratings summary={detail.ratings} authenticated={authenticated} value={selectedRating}
                  onChange={setSelectedRating} onSubmit={submitRating} busy={!viewer || Boolean(pending)} loginLink={loginLink} />
                <DocumentComments key={currentUser?.id ?? (authenticated ? 'signed-in' : 'guest')}
                  documentId={id} authenticated={authenticated} loginLink={loginLink} />
              </div>
              <aside className="reader-sidebar">
                <section className="reader-panel">
                  <h2>Thông tin tài liệu</h2>
                  <dl>
                    <dt>Môn học</dt><dd>{document.subjectName}</dd>
                    <dt>Mã môn học</dt><dd>{document.subjectCode}</dd>
                    {document.facultyName && <><dt>Khoa quản lý</dt><dd>{document.facultyName}</dd></>}
                    <dt>Định dạng</dt><dd>{document.fileType}</dd>
                    <dt>Trạng thái</dt><dd className="reader-approved">Đã duyệt</dd>
                  </dl>
                  {document.description && <p className="reader-description">{document.description}</p>}
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function DocumentDetailPage(props) {
  const { id } = useParams()
  return <DocumentDetail key={id} id={id} {...props} />
}
