import { canEnterAdmin } from '../services/adminAccess'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PublishedDocumentList } from '../components/DocumentCards'
import SubjectCard from '../components/SubjectCard'
import Toast, { useToast } from '../components/Toast'
import { BrowseStatus, FollowError } from '../components/BrowseControls'
import useLibraryData from '../hooks/useLibraryData'
import useSubjectFollows from '../hooks/useSubjectFollows'
import { getSubjects } from '../services/subjectApi'
import { getAcademicCatalog } from '../services/academicApi'
import brandMark from '../assets/brand-mark.svg'
import '../styles/home.css'
import NotificationBell from '../components/NotificationBell'

function Icon({ name, size = 18, className = '' }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    building: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    down: <path d="m7 10 5 5 5-5" />,
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {paths[name]}
    </svg>
  )
}

export function HomeHeader({
  activePage = 'home',
  authenticated,
  currentUser,
  onLogout,
  searchInput,
  onSearchChange,
  onSearchSubmit,
}) {
  return (
    <header className="home-header">
      <div className="home-header__inner">
        <Link className="home-brand" to="/" aria-label="EduShare - Trang chủ">
          <span className="home-brand__mark" aria-hidden="true">
            <img src={brandMark} alt="" width="22" height="18" />
          </span>
          <span>EduShare</span>
        </Link>

        <nav className="home-nav" aria-label="Điều hướng chính">
          <Link
            className={`home-nav__link${activePage === 'home' ? ' home-nav__link--active' : ''}`}
            to="/"
          >
            Trang chủ
          </Link>
          <Link className={`home-nav__link${activePage === 'explore' ? ' home-nav__link--active' : ''}`} aria-current={activePage === 'explore' ? 'page' : undefined} to="/explore">
            Khám phá tài liệu
          </Link>
          <Link className={`home-nav__link${activePage === 'subjects' ? ' home-nav__link--active' : ''}`} aria-current={activePage === 'subjects' ? 'page' : undefined} to="/subjects">
            Môn học
          </Link>
          <Link
            className={`home-nav__link${activePage === 'upload' ? ' home-nav__link--active' : ''}`}
            to="/upload"
          >
            Tải lên
          </Link>
        </nav>

        <div className="home-header__actions">
          <form
            className="home-header__search"
            role="search"
            onSubmit={onSearchSubmit}
          >
            <label>
              <span className="sr-only">Tìm kiếm tài liệu hoặc môn học</span>
              <Icon name="search" size={17} />
              <input
                aria-label="Tìm kiếm tài liệu hoặc môn học"
                onChange={onSearchChange}
                placeholder="Tìm kiếm tài liệu, môn học..."
                type="search"
                value={searchInput}
              />
            </label>
          </form>

          {authenticated && <NotificationBell />}

          {authenticated ? (
            <div className="home-profile-menu">
              <Link
                className="home-profile"
                to="/profile"
                aria-label="Mở hồ sơ cá nhân"
              >
                <span className="home-profile__name">Student</span>
                <span className="home-profile__avatar" aria-hidden="true">
                  <Icon name="user" size={16} />
                </span>
                <Icon className="home-profile__chevron" name="down" size={14} />
                <span className="sr-only">Tài khoản</span>
              </Link>
              <div className="home-profile-menu__popover">
                {canEnterAdmin(currentUser) && (
                  <Link to="/admin">Quản trị hệ thống</Link>
                )}
                <Link to="/profile">
                  <Icon name="user" size={16} /> Hồ sơ cá nhân
                </Link>
                <button aria-label="Đăng xuất" onClick={onLogout} type="button">
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="home-auth-actions">
              <Link className="home-auth-actions__login" to="/login">
                Đăng nhập
              </Link>
              <Link className="home-auth-actions__register" to="/register">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function SectionLink({ children }) {
  return (
    <Link className="home-section__link" to="/subjects">
      {children}
      <Icon name="arrow" size={19} />
    </Link>
  )
}

export default function HomePage({
  authenticated = false,
  currentUser,
  onLogout = () => {},
}) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchTerm = searchParams.get('query') || ''
  const [searchInput, setSearchInput] = useState(searchTerm)
  useEffect(() => setSearchInput(searchTerm), [searchTerm])
  const [subject, setSubject] = useState('')
  const popular = useLibraryData('popular-subjects', () => getSubjects({ size: 3 }))
  const catalog = useLibraryData('catalog', getAcademicCatalog)
  const subjects = [...new Map((catalog.data || []).flatMap((faculty) => faculty.majors.flatMap((major) => major.subjects)).map((item) => [item.id, item])).values()]
  const { toast, notify, dismiss } = useToast()
  const follows = useSubjectFollows({ authenticated, currentUser, notify })

  const handleSubmit = (event) => {
    event.preventDefault()
    const query = searchInput.trim()
    const filters = new URLSearchParams()
    if (query) filters.set('query', query)
    if (subject) filters.set('subjectId', subject)
    navigate(`/explore${filters.size ? `?${filters}` : ''}`)
  }

  return (
    <div className="home-page">
      <HomeHeader
        currentUser={currentUser}
        authenticated={authenticated}
        onLogout={onLogout}
        onSearchChange={(event) => setSearchInput(event.target.value)}
        onSearchSubmit={handleSubmit}
        searchInput={searchInput}
      />
      <main>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero__content">
            <h1 id="home-title">
              Kho tài liệu học tập đại học chuẩn
              <br />
              xác từ cộng đồng sinh viên
            </h1>
            <p>
              Hơn 50,000+ giáo trình, bài giảng, đề thi và đồ án được kiểm duyệt
              minh bạch.
            </p>
            <form className="home-search" role="search" onSubmit={handleSubmit}>
              <label className="home-search__input">
                <span className="sr-only">Từ khóa tìm kiếm</span>
                <Icon name="search" size={21} />
                <input
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Tìm theo tên môn, mã học phần, từ khóa..."
                  type="search"
                  value={searchInput}
                />
              </label>
              <label className="home-search__select">
                <span className="sr-only">Chọn môn học</span>
                <select
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                >
                  <option value="">Tất cả môn học</option>
                  {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <button type="submit">Tìm kiếm</button>
            </form>
          </div>
        </section>

        <section className="home-content" aria-label="Khám phá tài liệu">
          <section
            className="home-section"
            id="popular-courses"
            aria-labelledby="popular-title"
          >
            <div className="home-section__header">
              <div>
                <h2 id="popular-title">Môn học phổ biến</h2>
                <p>Những môn học có nhiều tài liệu chia sẻ từ cộng đồng</p>
              </div>
              <SectionLink>Xem tất cả</SectionLink>
            </div>

            <FollowError follows={follows} />
            <BrowseStatus resource={popular} loading="Đang tải môn học…" empty="Chưa có môn học trong danh mục." />
            {popular.data && (
              <div className="home-grid home-grid--courses">
                {popular.data.items.map((subject) => (
                  <SubjectCard subject={subject} follows={follows} key={subject.id} />
                ))}
              </div>
            )}
          </section>

          <section
            className="home-section home-section--documents"
            aria-labelledby="documents-title"
          >
            <div className="home-section__header home-section__header--documents">
              <h2 id="documents-title">Tài liệu phổ biến &amp; mới tải lên</h2>
            </div>
            <PublishedDocumentList key={searchTerm} query={searchTerm} />
          </section>
        </section>
      </main>
      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  )
}
