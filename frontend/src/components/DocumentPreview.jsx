import { useEffect, useState } from 'react'
import { getDocumentPreview } from '../services/libraryApi'

export default function DocumentPreview({ documentId, available }) {
  const [preview, setPreview] = useState(null)
  const [failure, setFailure] = useState(null)
  const [retry, setRetry] = useState(0)
  const url = available && preview?.id === documentId && preview.retry === retry ? preview.url : ''
  const error = failure?.id === documentId && failure.retry === retry ? failure.message : ''

  useEffect(() => {
    if (!available) return
    let active = true
    let objectUrl
    getDocumentPreview(documentId)
      .then((blob) => {
        if (!active) return
        if (!blob.size) throw new Error('Bản xem trước đang trống. Vui lòng thử lại sau.')
        objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
        setPreview({ id: documentId, retry, url: objectUrl })
      })
      .catch((err) => { if (active) setFailure({ id: documentId, retry, message: err.message || 'Không thể tải bản xem trước.' }) })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [documentId, available, retry])

  return (
    <section className="reader-panel reader-preview">
      <header>
        <h2>Xem trước tài liệu</h2>
      </header>
      {url ? <iframe src={`${url}#toolbar=0&navpanes=0&view=FitH`} title="Bản xem trước PDF" /> : (
        <div className="reader-preview__placeholder" aria-busy={available && !error}>
          {!available ? <p>Chưa có bản xem trước. Bạn có thể tải tệp gốc.</p> : error ? (
            <div role="alert"><strong>Không thể mở bản xem trước</strong><p>{error}</p><button className="reader-button" type="button" onClick={() => {
              setRetry((value) => value + 1)
            }}>Thử lại</button></div>
          ) : <p role="status">Đang tải bản xem trước…</p>}
        </div>
      )}
    </section>
  )
}
