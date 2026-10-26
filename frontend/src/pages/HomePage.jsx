import { useMemo, useState } from 'react'
import brandMark from '../assets/brand-mark.svg'
import '../styles/home.css'

const courses = [
  {
    id: 1,
    code: 'INT1301',
    title: 'Cấu trúc dữ liệu & Giải thuật',
    description: 'Nghiên cứu các cấu trúc dữ liệu nâng cao, thuật toán sắp xếp, tìm kiếm và phân tích độ phức tạp.',
    faculty: 'Khoa Công nghệ Thông tin',
    documents: 142,
  },
  {
    id: 2,
    code: 'INT1301',
    title: 'Cấu trúc dữ liệu & Giải thuật',
    description: 'Nghiên cứu các cấu trúc dữ liệu nâng cao, thuật toán sắp xếp, tìm kiếm và phân tích độ phức tạp.',
    faculty: 'Khoa Công nghệ Thông tin',
    documents: 142,
  },
  {
    id: 3,
    code: 'INT1301',
    title: 'Cấu trúc dữ liệu & Giải thuật',
    description: 'Nghiên cứu các cấu trúc dữ liệu nâng cao, thuật toán sắp xếp, tìm kiếm và phân tích độ phức tạp.',
    faculty: 'Khoa Công nghệ Thông tin',
    documents: 142,
  },
]

const documents = [
  {
    id: 1,
    type: 'SLIDE',
    rating: '4.9',
    reviews: 48,
    title: 'Tổng hợp Slide Lý thuyết Lập trình Hướng đối tượng Java (Full 15 buổi)',
    description: 'Bao gồm toàn bộ kiến thức từ cơ bản đến nâng cao: Class, Object, Inheritance, Polymorphism, Exception...',
    author: 'Nguyễn Văn Nam',
    date: '12/10/2024',
    downloads: '3,420',
    size: '14.2 MB',
    pages: 45,
  },
  {
    id: 2,
    type: 'SLIDE',
    rating: '4.9',
    reviews: 48,
    title: 'Tổng hợp Slide Lý thuyết Lập trình Hướng đối tượng Java (Full 15 buổi)',
    description: 'Bao gồm toàn bộ kiến thức từ cơ bản đến nâng cao: Class, Object, Inheritance, Polymorphism, Exception...',
    author: 'Nguyễn Văn Nam',
    date: '12/10/2024',
    downloads: '3,420',
    size: '14.2 MB',
    pages: 45,
  },
  {
    id: 3,
    type: 'SLIDE',
    rating: '4.9',
    reviews: 48,
    title: 'Tổng hợp Slide Lý thuyết Lập trình Hướng đối tượng Java (Full 15 buổi)',
    description: 'Bao gồm toàn bộ kiến thức từ cơ bản đến nâng cao: Class, Object, Inheritance, Polymorphism, Exception...',
    author: 'Nguyễn Văn Nam',
    date: '12/10/2024',
    downloads: '3,420',
    size: '14.2 MB',
    pages: 45,
  },
]

function Icon({ name, size = 18, className = '' }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    building: <><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
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
  onLogout,
  searchInput,
  onSearchChange,
  onSearchSubmit,
}) {
  return (
    <header className="home-header">
      <div className="home-header__inner">
        <a className="home-brand" href="#home" aria-label="EduShare - Trang chủ">
          <span className="home-brand__mark" aria-hidden="true">
            <img src={brandMark} alt="" width="22" height="18" />
          </span>
          <span>EduShare</span>
        </a>

        <nav className="home-nav" aria-label="Điều hướng chính">
          <a className={`home-nav__link${activePage === 'home' ? ' home-nav__link--active' : ''}`} href="#home">Trang chủ</a>
          <a className="home-nav__link" href="#popular-courses">Khám phá tài liệu</a>
          <a className="home-nav__link" href="#popular-courses">Môn học</a>
          <a className={`home-nav__link${activePage === 'upload' ? ' home-nav__link--active' : ''}`} href="#upload">Tải lên</a>
        </nav>

        <div className="home-header__actions">
          <form className="home-header__search" role="search" onSubmit={onSearchSubmit}>
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

          <a className="home-notification" href="#notifications" aria-label="Thông báo">
            <Icon name="bell" size={19} />
            <span aria-hidden="true" />
          </a>

          {authenticated ? (
            <div className="home-profile-menu">
              <a className="home-profile" href="#profile" aria-label="Mở hồ sơ cá nhân">
                <span className="home-profile__name">Student</span>
                <span className="home-profile__avatar" aria-hidden="true"><Icon name="user" size={16} /></span>
                <Icon className="home-profile__chevron" name="down" size={14} />
                <span className="sr-only">Tài khoản</span>
              </a>
              <div className="home-profile-menu__popover">
                <a href="#profile"><Icon name="user" size={16} /> Hồ sơ cá nhân</a>
                <button aria-label="Đăng xuất" onClick={onLogout} type="button">Đăng xuất</button>
              </div>
            </div>
          ) : (
            <div className="home-auth-actions">
              <a className="home-auth-actions__login" href="#login">Đăng nhập</a>
              <a className="home-auth-actions__register" href="#register">Đăng ký</a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function SectionLink({ children }) {
  return (
    <a className="home-section__link" href="#all" onClick={(event) => event.preventDefault()}>
      {children}
      <Icon name="arrow" size={19} />
    </a>
  )
}

function CourseCard({ course }) {
  const [followed, setFollowed] = useState(false)

  return (
    <article className="course-card">
      <div className="course-card__topline">
        <span className="course-card__code">{course.code}</span>
        <button
          aria-pressed={followed}
          className={`course-card__follow${followed ? ' course-card__follow--active' : ''}`}
          onClick={() => setFollowed((current) => !current)}
          type="button"
        >
          {!followed && <Icon name="plus" size={17} />}
          {followed ? 'Đang theo dõi' : 'Theo dõi'}
        </button>
      </div>
      <h3>{course.title}</h3>
      <p className="course-card__description">{course.description}</p>
      <div className="course-card__meta">
        <span><Icon name="building" size={17} />{course.faculty}</span>
        <strong>{course.documents} tài liệu</strong>
      </div>
      <button className="course-card__detail" type="button">Xem chi tiết môn học</button>
    </article>
  )
}

function DocumentCard({ document }) {
  return (
    <article className="document-card">
      <div className="document-card__topline">
        <span className="document-card__type">{document.type}</span>
        <span className="document-card__rating"><b aria-hidden="true">★</b> {document.rating} <span>({document.reviews})</span></span>
      </div>
      <h3>{document.title}</h3>
      <p className="document-card__description">{document.description}</p>
      <div className="document-card__author">
        <span className="document-card__avatar">N</span>
        <span>{document.author}</span>
        <time dateTime="2024-10-12">{document.date}</time>
      </div>
      <div className="document-card__footer">
        <span className="document-card__stats">
          <Icon name="download" size={16} />
          {document.downloads} lượt tải <i>•</i> {document.size} <i>•</i> {document.pages} trang
        </span>
        <button type="button"><Icon name="eye" size={17} />Xem nhanh</button>
      </div>
    </article>
  )
}

export default function HomePage({ authenticated = false, onLogout = () => {} }) {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [subject, setSubject] = useState('all')

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('vi')
    if (!query) return courses

    return courses.filter((course) =>
      [course.code, course.title, course.description, course.faculty]
        .some((value) => value.toLocaleLowerCase('vi').includes(query)),
    )
  }, [searchTerm])

  const handleSubmit = (event) => {
    event.preventDefault()
    setSearchTerm(searchInput)
    document.querySelector('#popular-courses')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="home-page">
      <HomeHeader
        authenticated={authenticated}
        onLogout={onLogout}
        onSearchChange={(event) => setSearchInput(event.target.value)}
        onSearchSubmit={handleSubmit}
        searchInput={searchInput}
      />
      <main>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__content">
          <h1 id="home-title">Kho tài liệu học tập đại học chuẩn<br />xác từ cộng đồng sinh viên</h1>
          <p>Hơn 50,000+ giáo trình, bài giảng, đề thi và đồ án được kiểm duyệt minh bạch.</p>
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
              <select value={subject} onChange={(event) => setSubject(event.target.value)}>
                <option value="all">Tất cả môn học</option>
                <option value="information-technology">Công nghệ thông tin</option>
                <option value="economics">Kinh tế</option>
              </select>
            </label>
            <button type="submit">Tìm kiếm</button>
          </form>
        </div>
      </section>

      <section className="home-content" aria-label="Khám phá tài liệu">
        <section className="home-section" id="popular-courses" aria-labelledby="popular-title">
          <div className="home-section__header">
            <div>
              <h2 id="popular-title">Môn học phổ biến</h2>
              <p>Danh mục học phần được truy cập nhiều nhất học kỳ này</p>
            </div>
            <SectionLink>Xem tất cả</SectionLink>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="home-grid home-grid--courses">
              {filteredCourses.map((course) => <CourseCard course={course} key={course.id} />)}
            </div>
          ) : (
            <div className="home-empty">Không tìm thấy môn học phù hợp với “{searchTerm}”.</div>
          )}
        </section>

        <section className="home-section home-section--documents" aria-labelledby="documents-title">
          <div className="home-section__header home-section__header--documents">
            <h2 id="documents-title">Tài liệu nổi bật &amp; Mới tải lên</h2>
            <SectionLink>Xem thêm</SectionLink>
          </div>
          <div className="home-grid home-grid--documents">
            {documents.map((document) => <DocumentCard document={document} key={document.id} />)}
          </div>
        </section>
      </section>
      </main>
    </div>
  )
}
