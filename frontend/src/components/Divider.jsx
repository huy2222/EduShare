import React from 'react'

export default function Divider({ children }) {
  return (
    <div className="divider" aria-label={children}>
      <span />
      <p>{children}</p>
      <span />
    </div>
  )
}
