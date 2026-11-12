import { useEffect, useState } from 'react'
import { getDocumentPreview } from '../services/libraryApi'

export default function DocumentPreview({ documentId, available }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!available) return
    let active = true
    let objectUrl
    getDocumentPreview(documentId)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch((err) => { if (active) setError(err.message) })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [documentId, available, retry])

  return (
    <section className="reader-panel reader-preview">
      <header>
        <h2>Xem trước tài liệu</h2>
        {url && <a href={url} target="_blank" rel="noreferrer">Mở PDF</a>}
      </header>
      {url ? <iframe src={url} title="Bản xem trước PDF" /> : (
        <div className="reader-preview__placeholder">
          {!available ? <p>Chưa có bản xem trước. Bạn có thể tải tệp gốc.</p> : error ? (
            <p role="alert">{error} <button type="button" onClick={() => {
              setError('')
              setRetry((value) => value + 1)
            }}>Thử lại</button></p>
          ) : <p role="status">Đang tải bản xem trước…</p>}
        </div>
      )}
    </section>
  )
}
