import { formatDocumentNumber } from '../services/documentDisplay'

export function BrowseStatus({ resource, loading = 'Đang tải dữ liệu…', empty = 'Không tìm thấy kết quả phù hợp.' }) {
  if (resource.error) return <div className="library-message" role="alert"><p>{resource.error}</p><button type="button" onClick={resource.reload}>Thử lại</button></div>
  if (!resource.data) return <div className="library-message" role="status">{loading}</div>
  if (resource.data.items?.length === 0) return <div className="library-message">{empty}</div>
  return null
}

export function BrowsePagination({ page, size = 6, total, onChange, noun = 'tài liệu' }) {
  const count = Math.ceil(total / size)
  if (page > 0 && page >= count) return <footer className="library-pagination-bar"><span>Không có kết quả ở trang này.</span><button type="button" onClick={() => onChange(0)}>Về trang đầu</button></footer>
  const pages = [...new Set([0, page - 1, page, page + 1, count - 1])].filter((value) => value >= 0 && value < count).sort((a, b) => a - b)
  return (
    <footer className="library-pagination-bar">
      <span>{total ? `Hiển thị ${formatDocumentNumber(page * size + 1)}–${formatDocumentNumber(Math.min((page + 1) * size, total))} trong tổng số ${formatDocumentNumber(total)} ${noun}` : `Có 0 ${noun}`}</span>
      {count > 1 && <nav aria-label={`Phân trang ${noun}`}>
        <button type="button" aria-label="Trang trước" disabled={page === 0} onClick={() => onChange(page - 1)}>‹</button>
        {pages.map((value, index) => <span key={value}>
          {index > 0 && value - pages[index - 1] > 1 && <span className="library-pagination-gap">…</span>}
          <button type="button" aria-label={`Trang ${value + 1}`} aria-current={page === value ? 'page' : undefined} onClick={() => onChange(value)}>{value + 1}</button>
        </span>)}
        <button type="button" aria-label="Trang sau" disabled={page >= count - 1} onClick={() => onChange(page + 1)}>›</button>
      </nav>}
    </footer>
  )
}

export function FollowError({ follows }) {
  return follows.error ? <p className="library-inline-error" role="alert">{follows.error} <button type="button" onClick={follows.reload}>Thử tải trạng thái theo dõi</button></p> : null
}
