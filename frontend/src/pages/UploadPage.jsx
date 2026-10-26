import { useState } from 'react'
import { HomeHeader } from './HomePage'
import '../styles/upload.css'

const reviewRules = [
  {
    title: 'Tiêu đề rõ ràng, chính xác',
    description: 'Không sử dụng ký tự đặc biệt vô nghĩa',
  },
  {
    title: 'Đúng môn học & chuyên ngành',
    description: 'Phân loại đúng để hỗ trợ người học khác',
  },
  {
    title: 'Nội dung học tập hợp lệ',
    description: 'Không vi phạm bản quyền hay tài liệu cấm',
  },
]

const documentTypes = [
  { value: 'slide', label: 'Bài giảng / Slide', icon: 'play' },
  { value: 'exam', label: 'Đề thi / Kiểm tra', icon: 'quiz' },
  { value: 'notes', label: 'Tóm tắt / Ghi chép', icon: 'notes' },
  { value: 'textbook', label: 'Giáo trình / Đề cương', icon: 'book' },
]

function UploadIcon({ name, size = 22 }) {
  const paths = {
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
    cloud: <><path d="M16 16l-4-4-4 4" /><path d="M12 12v9" /><path d="M20.4 17.5A5 5 0 0 0 18 8.2 7 7 0 0 0 4.3 10.8 4.5 4.5 0 0 0 5.5 19H8" /></>,
    fileUpload: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="m9 15 3-3 3 3" /><path d="M12 12v7" /></>,
    folderUpload: <><path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="m9 16 3-3 3 3" /><path d="M12 13v6" /></>,
    fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    check: <path d="m7 12 3 3 7-7" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></>,
    bulb: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8.4 15.5A7 7 0 1 1 15.6 15.5c-.9.7-1.4 1.5-1.6 2.5h-4c-.2-1-.7-1.8-1.6-2.5Z" /></>,
    trending: <><path d="m4 16 5-5 4 4 7-8" /><path d="M15 7h5v5" /></>,
    play: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m10 9 5 3-5 3Z" /></>,
    quiz: <><path d="M9 4H5a2 2 0 0 0-2 2v14h14v-4" /><rect x="8" y="2" width="13" height="16" rx="2" /><path d="M13 7a2 2 0 1 1 2 2c-1 0-1.5.8-1.5 1.5" /><path d="M13.5 14h.01" /></>,
    notes: <><path d="M4 6h10M4 10h10M4 14h6" /><path d="m13 18 5-5 2 2-5 5-3 1Z" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H11V5H6.5A2.5 2.5 0 0 0 4 7.5Z" /><path d="M20 19.5a2.5 2.5 0 0 0-2.5-2.5H13V5h4.5A2.5 2.5 0 0 1 20 7.5Z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>,
    tag: <><path d="M20.6 13.6 11 4H4v7l9.6 9.6a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8Z" /><circle cx="7.5" cy="7.5" r=".8" /></>,
    sparkle: <><path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2Z" /><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8Z" /></>,
  }

  return (
    <svg
      aria-hidden="true"
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

function CardHeading({ icon, tone = 'blue', title, subtitle }) {
  return (
    <div className="upload-card-heading">
      <span className={`upload-card-heading__icon upload-card-heading__icon--${tone}`}>
        <UploadIcon name={icon} size={22} />
      </span>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  )
}

export default function UploadPage({ authenticated = false, onLogout = () => {} }) {
  const [searchInput, setSearchInput] = useState('')
  const [documentType, setDocumentType] = useState('slide')
  const [semesterEnabled, setSemesterEnabled] = useState(true)
  const [tags, setTags] = useState(['Java', 'Cấu trúc dữ liệu', 'Stack', 'Queue'])
  const [tagInput, setTagInput] = useState('')

  const handleSearch = (event) => {
    event.preventDefault()
  }

  const addTag = (value) => {
    const nextTag = value.trim()
    if (!nextTag || tags.length >= 5 || tags.some((tag) => tag.toLocaleLowerCase('vi') === nextTag.toLocaleLowerCase('vi'))) return
    setTags((currentTags) => [...currentTags, nextTag])
    setTagInput('')
  }

  const handleTagKeyDown = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    addTag(tagInput)
  }

  return (
    <div className="upload-page">
      <HomeHeader
        activePage="upload"
        authenticated={authenticated}
        onLogout={onLogout}
        onSearchChange={(event) => setSearchInput(event.target.value)}
        onSearchSubmit={handleSearch}
        searchInput={searchInput}
      />

      <main className="upload-main">
        <div className="upload-page-header">
          <div>
            <nav className="upload-breadcrumb" aria-label="Đường dẫn trang">
              <a href="#home">Trang chủ</a>
              <UploadIcon name="chevron" size={16} />
              <a href="#my-documents">Tài liệu của tôi</a>
              <UploadIcon name="chevron" size={16} />
              <span>Tải lên</span>
            </nav>
            <h1>Tải tài liệu lên</h1>
            <p>Chia sẻ tài liệu học tập hữu ích<br />với cộng đồng sinh viên và giảng<br />viên EduShare.</p>
          </div>

          <div className="upload-page-actions">
            <a className="upload-button upload-button--cancel" href="#home">
              <UploadIcon name="close" size={18} />
              Hủy
            </a>
            <button className="upload-button upload-button--submit" form="upload-document-form" type="submit">
              <UploadIcon name="cloud" size={21} />
              Gửi tài liệu
            </button>
          </div>
        </div>

        <form
          className="upload-layout"
          id="upload-document-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="upload-layout__main">
            <section className="upload-card upload-file-card" aria-labelledby="upload-file-title">
              <div className="upload-card__topline">
                <CardHeading
                  icon="fileUpload"
                  title="Tệp tài liệu"
                  subtitle="Dung lượng tối đa cho mỗi tệp là 50MB"
                />
                <span className="upload-required-pill">Bắt buộc</span>
              </div>

              <label className="upload-dropzone" htmlFor="document-file">
                <input
                  accept=".pdf,.docx,.pptx,.zip"
                  className="upload-file-input"
                  id="document-file"
                  name="documentFile"
                  required
                  type="file"
                />
                <span className="upload-dropzone__icon"><UploadIcon name="folderUpload" size={37} /></span>
                <span className="upload-dropzone__title"><b>Kéo thả tệp vào đây</b> hoặc chọn tệp từ thiết bị</span>
                <span className="upload-dropzone__caption">Hỗ trợ định dạng: <strong>PDF, DOCX, PPTX, ZIP</strong></span>
              </label>
            </section>

            <section className="upload-card upload-details-card" aria-labelledby="upload-details-title">
              <CardHeading
                icon="fileText"
                tone="violet"
                title="Thông tin chi tiết"
                subtitle="Cung cấp thông tin chuẩn xác để sinh viên dễ dàng tra cứu"
              />

              <div className="upload-fields">
                <label className="upload-field">
                  <span>Tiêu đề tài liệu <b>*</b></span>
                  <input
                    name="title"
                    placeholder="VD: Slide bài giảng Cấu trúc dữ liệu và Giải thuật - Chương 1"
                    required
                    type="text"
                  />
                </label>

                <label className="upload-field">
                  <span className="upload-field__label-row">
                    <span>Mô tả tài liệu</span>
                    <small>Không bắt buộc</small>
                  </span>
                  <textarea
                    name="description"
                    placeholder="Nhóm nội dung chính, tóm tắt ngắn gọn hoặc hướng dẫn sử dụng tài liệu..."
                    rows="3"
                  />
                </label>

                <div className="upload-select-grid">
                  <label className="upload-field">
                    <span>Khoa <b>*</b></span>
                    <select defaultValue="information-technology" name="faculty" required>
                      <option value="information-technology">Khoa Công nghệ Thông tin</option>
                      <option value="economics">Khoa Kinh tế</option>
                      <option value="electrical">Khoa Điện - Điện tử</option>
                    </select>
                  </label>
                  <label className="upload-field">
                    <span>Ngành <b>*</b></span>
                    <select defaultValue="software-engineering" name="major" required>
                      <option value="software-engineering">Kỹ thuật Phần mềm</option>
                      <option value="information-systems">Hệ thống Thông tin</option>
                      <option value="computer-science">Khoa học Máy tính</option>
                    </select>
                  </label>
                  <label className="upload-field">
                    <span>Môn học <b>*</b></span>
                    <select defaultValue="int1301" name="subject" required>
                      <option value="int1301">INT1301 - Cấu trúc dữ liệu &amp; Giải thuật</option>
                      <option value="int1306">INT1306 - Lập trình hướng đối tượng</option>
                      <option value="int1415">INT1415 - Cơ sở dữ liệu</option>
                    </select>
                  </label>
                </div>

                <fieldset className="upload-document-types">
                  <legend>Loại tài liệu <b>*</b></legend>
                  <div className="upload-document-types__grid">
                    {documentTypes.map((type) => (
                      <label
                        className={`upload-document-type${documentType === type.value ? ' upload-document-type--active' : ''}`}
                        key={type.value}
                      >
                        <input
                          checked={documentType === type.value}
                          name="documentType"
                          onChange={() => setDocumentType(type.value)}
                          type="radio"
                          value={type.value}
                        />
                        <UploadIcon name={type.icon} size={20} />
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <section className="upload-extra-section upload-semester-section" aria-labelledby="semester-title">
                  <div className="upload-extra-heading">
                    <div>
                      <h3 id="semester-title"><UploadIcon name="calendar" size={19} /> Thông tin học kỳ &amp; năm học</h3>
                      <p>Giúp sinh viên tìm kiếm tài liệu theo học kỳ và năm học dễ dàng hơn.</p>
                    </div>
                    <label className="upload-toggle">
                      <span>Thêm thông tin</span>
                      <input
                        checked={semesterEnabled}
                        onChange={(event) => setSemesterEnabled(event.target.checked)}
                        type="checkbox"
                      />
                      <i aria-hidden="true" />
                    </label>
                  </div>

                  {semesterEnabled && (
                    <div className="upload-semester-grid">
                      <label className="upload-field">
                        <span>Học kỳ</span>
                        <select defaultValue="semester-1" name="semester">
                          <option value="semester-1">Học kỳ 1</option>
                          <option value="semester-2">Học kỳ 2</option>
                          <option value="summer">Học kỳ hè</option>
                        </select>
                      </label>
                      <label className="upload-field">
                        <span>Năm học</span>
                        <select defaultValue="2024-2025" name="academicYear">
                          <option value="2024-2025">2024–2025</option>
                          <option value="2025-2026">2025–2026</option>
                          <option value="2026-2027">2026–2027</option>
                        </select>
                      </label>
                    </div>
                  )}
                </section>

                <section className="upload-extra-section upload-tags-section" aria-labelledby="tags-title">
                  <div className="upload-tags-heading">
                    <div>
                      <h3 id="tags-title"><UploadIcon name="tag" size={19} /> Từ khóa (Tags) <small>Không bắt buộc</small></h3>
                      <p>Thêm các từ khóa liên quan để người khác dễ dàng tìm thấy tài liệu của bạn.</p>
                    </div>
                    <span>{tags.length}/5 từ khóa</span>
                  </div>

                  <div className="upload-tag-input" onClick={(event) => event.currentTarget.querySelector('input')?.focus()}>
                    {tags.map((tag) => (
                      <span className="upload-tag" key={tag}>
                        {tag}
                        <button
                          aria-label={`Xóa từ khóa ${tag}`}
                          onClick={() => setTags((currentTags) => currentTags.filter((currentTag) => currentTag !== tag))}
                          type="button"
                        >
                          <UploadIcon name="close" size={13} />
                        </button>
                      </span>
                    ))}
                    <input
                      aria-label="Nhập từ khóa"
                      disabled={tags.length >= 5}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={tags.length >= 5 ? 'Đã đủ 5 từ khóa' : 'Nhập từ khóa và nhấn Enter...'}
                      type="text"
                      value={tagInput}
                    />
                  </div>

                  <div className="upload-tag-suggestions">
                    <span><UploadIcon name="sparkle" size={17} /> Gợi ý môn học:</span>
                    {['Thuật toán', 'Lập trình hướng đối tượng', 'Đệ quy', 'Cây nhị phân'].map((suggestion) => (
                      <button onClick={() => addTag(suggestion)} type="button" key={suggestion}>+ {suggestion}</button>
                    ))}
                  </div>
                </section>
              </div>
            </section>
          </div>

          <aside className="upload-layout__aside">
            <section className="upload-card upload-review-card" aria-labelledby="review-title">
              <CardHeading icon="shield" title="Quy chế kiểm duyệt" />
              <p className="upload-side-description">
                Tài liệu của bạn sẽ được quản trị viên kiểm duyệt trước khi hiển thị công khai trên nền tảng EduShare.
              </p>

              <div className="upload-rule-list">
                {reviewRules.map((rule) => (
                  <div className="upload-rule" key={rule.title}>
                    <span className="upload-rule__check"><UploadIcon name="check" size={16} /></span>
                    <span><strong>{rule.title}</strong><small>{rule.description}</small></span>
                  </div>
                ))}
              </div>

              <div className="upload-review-time">
                <span><UploadIcon name="clock" size={22} /> Thời gian kiểm duyệt:</span>
                <strong>2 - 4 giờ làm việc</strong>
              </div>
            </section>

            <section className="upload-card upload-tip-card" aria-labelledby="tip-title">
              <CardHeading icon="bulb" tone="violet" title="Mẹo nhỏ cho bạn" />
              <p className="upload-side-description">
                Tài liệu có chất lượng hình ảnh sắc nét, có mục lục rõ ràng và định dạng PDF chuẩn thường được ưu tiên duyệt nhanh hơn và nhận nhiều lượt tải về từ cộng đồng.
              </p>
              <div className="upload-tip-highlight">
                <span><UploadIcon name="trending" size={22} /></span>
                <p>Tài liệu đầy đủ thông tin tăng <strong>+85%</strong> lượt tải học thuật.</p>
              </div>
            </section>
          </aside>
        </form>
      </main>
      <footer className="upload-footer">© 2024 EduShare Platform. All rights reserved.</footer>
    </div>
  )
}
