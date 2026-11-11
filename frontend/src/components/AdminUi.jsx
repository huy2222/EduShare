import { useEffect, useRef } from 'react'
const number = (value) => (value || 0).toLocaleString('vi-VN')

export function LoadingOverlay({ message = 'Đang xử lý…' }) {
  return (
    <div className="admin-loading-overlay" role="status" aria-live="assertive" aria-label={message}>
      <div className="admin-loading-card">
        <span className="admin-loading-spinner" aria-hidden="true" />
        <strong>{message}</strong>
        <small>Vui lòng chờ trong giây lát.</small>
      </div>
    </div>
  )
}

export function Modal({ title, children, onClose, busy }) {
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

export function Pagination({ page, total, onChange, size = 10 }) {
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
