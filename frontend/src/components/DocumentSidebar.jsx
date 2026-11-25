import { Link } from 'react-router-dom'
import { formatDocumentDate, formatDocumentNumber, formatDocumentSize } from '../services/documentDisplay'

export default function DocumentSidebar({ document, uploader, relatedDocuments = [] }) {
  const name = uploader?.name || document.author
  const initials = name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('')
  const subjectLink = `/explore?${new URLSearchParams({ query: document.subjectCode })}`

  return (
    <aside className="reader-sidebar">
      <section className="reader-panel" aria-labelledby="document-info-title">
        <h2 id="document-info-title">Thông tin tài liệu</h2>
        <dl>
          <dt>Môn học</dt><dd><Link to={subjectLink}>{document.subjectName}</Link></dd>
          <dt>Mã môn học</dt><dd>{document.subjectCode}</dd>
          {document.facultyName && <><dt>Khoa quản lý</dt><dd>{document.facultyName}</dd></>}
          <dt>Định dạng</dt><dd>{document.fileType}</dd>
          <dt>Dung lượng</dt><dd>{formatDocumentSize(document.fileSize)}</dd>
        </dl>
        {document.description && <p className="reader-description">{document.description}</p>}
      </section>

      <section className="reader-panel reader-uploader" aria-labelledby="document-uploader-title">
        <h2 id="document-uploader-title">Thông tin người đăng</h2>
        <span className="reader-avatar reader-uploader__avatar" aria-hidden="true">{initials}</span>
        <h3>{name}</h3>
        <p className="reader-uploader__major">{uploader?.majorName || 'Thành viên EduShare'}</p>
        {uploader?.bio && <p className="reader-uploader__bio">{uploader.bio}</p>}
        {uploader && (
          <div className="reader-uploader__stats">
            <div><strong>{formatDocumentNumber(uploader.publishedDocuments)}</strong><span>Tài liệu đã chia sẻ</span></div>
            {uploader.joinedAt && (
              <div><strong>{formatDocumentDate(uploader.joinedAt)}</strong><span>Ngày tham gia</span></div>
            )}
          </div>
        )}
      </section>

      <section className="reader-panel" aria-labelledby="related-documents-title">
        <h2 id="related-documents-title">Tài liệu liên quan</h2>
        {relatedDocuments.length ? (
          <ul className="reader-related">
            {relatedDocuments.map((item) => (
              <li key={item.id}>
                <Link className="reader-related__link" to={`/documents/${item.id}`}>
                  <span className="reader-related__icon" aria-hidden="true">
                    <svg width="22" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3H6v18h13V8z" /><path d="M14 3v5h5M9 12h7M9 16h5" />
                    </svg>
                  </span>
                  <span className="reader-related__body">
                    <strong>{item.title}</strong>
                    <span>{item.subjectCode} · {item.fileType} · {formatDocumentSize(item.fileSize)}</span>
                    <span className="reader-related__metrics">
                      <span><b aria-hidden="true">★</b> {formatDocumentNumber(item.averageRating)}/5</span>
                      <span>{formatDocumentNumber(item.downloads)} lượt tải</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="reader-related__empty">Chưa có tài liệu liên quan cùng môn học.</p>}
        <Link className="reader-button reader-related__more" to={subjectLink}>Xem tài liệu cùng môn</Link>
      </section>
    </aside>
  )
}
