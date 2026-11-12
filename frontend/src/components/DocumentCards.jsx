import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDocumentDate, formatDocumentNumber, formatDocumentSize } from '../services/documentDisplay'
import { getPublishedDocuments } from '../services/libraryApi'

export function DocumentCard({ document }) {
  return (
    <article className="document-card">
      <div className="document-card__topline">
        <span className="document-card__type">{document.fileType}</span>
        <span className="document-card__rating">
          <b aria-hidden="true">★</b> {formatDocumentNumber(document.averageRating)}/5
        </span>
      </div>
      <h3>{document.title}</h3>
      <p className="document-card__description">{document.description || document.subjectName}</p>
      <div className="document-card__author">
        <span className="document-card__avatar" aria-hidden="true">{document.author.slice(0, 1)}</span>
        <span>{document.author}</span>
        <time dateTime={document.createdAt}>{formatDocumentDate(document.createdAt)}</time>
      </div>
      <div className="document-card__footer">
        <span className="document-card__stats">
          {formatDocumentNumber(document.downloads)} lượt tải <i>•</i> {formatDocumentSize(document.fileSize)}
        </span>
        <Link to={`/documents/${document.id}`}>Xem chi tiết</Link>
      </div>
    </article>
  )
}

export function DocumentPagination({ page, hasNext, onChange, busy = false }) {
  if (page === 0 && !hasNext) return null
  return (
    <nav className="library-pagination" aria-label="Phân trang">
      <button type="button" disabled={busy || page === 0} onClick={() => onChange(page - 1)}>Trang trước</button>
      <span>Trang {page + 1}</span>
      <button type="button" disabled={busy || !hasNext} onClick={() => onChange(page + 1)}>Trang sau</button>
    </nav>
  )
}

export function PublishedDocumentList({ query }) {
  const [page, setPage] = useState(0)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    getPublishedDocuments(query, page)
      .then(({ result }) => { if (active) setResponse(result) })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [query, page, retry])

  function changePage(nextPage) {
    setResponse(null)
    setPage(nextPage)
  }

  if (error) return (
    <p role="alert">{error} <button type="button" onClick={() => {
      setError('')
      setRetry((value) => value + 1)
    }}>Thử lại</button></p>
  )
  if (!response) return <p role="status">Đang tải tài liệu…</p>

  return (
    <>
      {response.items.length === 0 && <p>Chưa tìm thấy tài liệu đã duyệt phù hợp.</p>}
      <div className="home-grid home-grid--documents">
        {response.items.map((document) => <DocumentCard key={document.id} document={document} />)}
      </div>
      <DocumentPagination page={page} hasNext={response.hasNext} onChange={changePage} />
    </>
  )
}
