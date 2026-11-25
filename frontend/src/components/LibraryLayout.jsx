import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HomeHeader } from '../pages/HomePage'
import '../styles/library.css'

export default function LibraryLayout({ activePage, breadcrumbs, children, authenticated, currentUser, onLogout }) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  return (
    <div className="home-page library-page">
      <HomeHeader activePage={activePage} authenticated={authenticated} currentUser={currentUser} onLogout={onLogout}
        searchInput={search} onSearchChange={(event) => setSearch(event.target.value)}
        onSearchSubmit={(event) => { event.preventDefault(); navigate(`/explore?${new URLSearchParams({ query: search.trim() })}`) }} />
      <main className="library-main">
        <nav className="library-breadcrumb" aria-label="Đường dẫn">
          <Link to="/">Trang chủ</Link>
          {breadcrumbs.map((item, index) => <span key={index}><span aria-hidden="true">›</span>{item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</span>)}
        </nav>
        {children}
      </main>
    </div>
  )
}
