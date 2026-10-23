import React from 'react'
import brandMark from '../assets/brand-mark.svg'

export default function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <img src={brandMark} alt="" width="22" height="18" />
    </div>
  )
}
