import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../styles/toast.css'

export function useToast() {
  const [toast, setToast] = useState(null)
  const sequence = useRef(0)
  const notify = useCallback((message, error = false) => {
    setToast({ id: ++sequence.current, message, error })
  }, [])
  const dismiss = useCallback(() => setToast(null), [])
  return { toast, notify, dismiss }
}

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(onDismiss, 3500)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null
  return createPortal(
    <div key={toast.id} className={`app-toast${toast.error ? ' app-toast--error' : ''}`}
      role={toast.error ? 'alert' : 'status'} aria-atomic="true">
      <span className="app-toast__icon" aria-hidden="true">{toast.error ? '!' : '✓'}</span>
      <p>{toast.message}</p>
      <button type="button" aria-label="Đóng thông báo" onClick={onDismiss}>×</button>
    </div>,
    document.body,
  )
}
