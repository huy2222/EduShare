import { useEffect, useRef } from 'react'
export const formatAdminNumber = (value) => (value || 0).toLocaleString('vi-VN')

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
        trên {formatAdminNumber(total)} kết quả
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

export function AdminIcon({ name }) {
  const paths = {
    access: (
      <>
        <path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5" />
      </>
    ),
    faculties: (
      <>
        <path d="M3 21h18M5 21V6l7-3 7 3v15M9 8h1m4 0h1M9 12h1m4 0h1M10 21v-5h4v5" />
      </>
    ),
    subjects: (
      <>
        <path d="M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1v16" />
      </>
    ),
    documents: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    moderation: (
      <>
        <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
    search: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="m15 15 6 6" />
      </>
    ),
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.subjects}
    </svg>
  );
}
