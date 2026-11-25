import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDocumentPreview } from '../services/libraryApi'

export default function DocumentPreview({ documentId, available, authenticated = false }) {
  const [preview, setPreview] = useState(null)
  const [failure, setFailure] = useState(null)
  const [retry, setRetry] = useState(0)
  const scope = authenticated ? 'full' : 'guest'
  const error = failure?.id === documentId && failure.scope === scope && failure.retry === retry ? failure.message : ''
  const url = !error && available && preview?.id === documentId && preview.scope === scope && preview.retry === retry ? preview.url : ''

  useEffect(() => {
    setPreview(null)
    setFailure(null)
    if (!available) return
    let active = true
    let objectUrl
    getDocumentPreview(documentId, { authenticated })
      .then((blob) => {
        if (!active) return
        if (!blob.size) throw new Error('Bản xem trước đang trống. Vui lòng thử lại sau.')
        const expectedType = authenticated ? 'application/pdf' : 'image/png'
        if (blob.type !== expectedType) throw new Error('Định dạng bản xem trước không hợp lệ. Vui lòng thử lại sau.')
        objectUrl = URL.createObjectURL(blob)
        setPreview({ id: documentId, scope, retry, url: objectUrl })
      })
      .catch((err) => { if (active) setFailure({ id: documentId, scope, retry, message: err.message || 'Không thể tải bản xem trước.' }) })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [documentId, available, authenticated, scope, retry])

  return (
    <section className="reader-panel reader-preview">
      <header>
        <h2>Xem trước tài liệu</h2>
        {!authenticated && <span className="reader-preview__badge">Bản xem giới hạn</span>}
      </header>
      {url ? authenticated ? (
        <iframe src={`${url}#toolbar=0&navpanes=0&view=FitH`} title="Bản xem trước PDF" />
      ) : (
        <div className="reader-preview__sample">
          <img src={url} alt="Xem trước một phần trang đầu của tài liệu" onError={() => {
            setFailure({ id: documentId, scope, retry, message: 'Không thể hiển thị ảnh xem trước. Vui lòng thử lại.' })
          }} />
        </div>
      ) : (
        <div className="reader-preview__placeholder" aria-busy={available && !error}>
          {!available ? <p>{authenticated ? 'Chưa có bản xem trước. Bạn có thể tải tệp gốc.' : 'Chưa có bản xem trước cho tài liệu này.'}</p> : error ? (
            <div role="alert"><strong>Không thể mở bản xem trước</strong><p>{error}</p><button className="reader-button" type="button" onClick={() => {
              setRetry((value) => value + 1)
            }}>Thử lại</button></div>
          ) : <p role="status">Đang tải bản xem trước…</p>}
        </div>
      )}
      {!authenticated && (
        <div className="reader-preview__gate">
          <svg className="reader-preview__lock" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" />
          </svg>
          <h3>Đăng nhập để xem đầy đủ</h3>
          <p>{url ? 'Bạn đang xem một phần trang đầu. ' : ''}Đăng nhập để đọc toàn bộ tài liệu và tải tệp gốc.</p>
          <Link className="reader-button reader-button--primary" to="/login" state={{ returnTo: `/documents/${documentId}` }}>Đăng nhập để xem đầy đủ</Link>
        </div>
      )}
    </section>
  )
}
