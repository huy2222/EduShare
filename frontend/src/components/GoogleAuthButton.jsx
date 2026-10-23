import { useEffect, useRef, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'

export default function GoogleAuthButton({ onSuccess, onError, text = 'continue_with' }) {
  const containerRef = useRef(null)
  const [width, setWidth] = useState(240)

  useEffect(() => {
    const updateWidth = () => {
      const nextWidth = Math.floor(containerRef.current?.getBoundingClientRect().width ?? 0)
      if (nextWidth > 0) setWidth(nextWidth)
    }

    updateWidth()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }

    const observer = new ResizeObserver(updateWidth)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="google-signin" ref={containerRef}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        text={text}
        shape="rectangular"
        size="large"
        width={String(width)}
        locale="vi"
      />
    </div>
  )
}
