import { Link } from 'react-router-dom'
import LibraryIcon from './LibraryIcon'
import { formatDocumentNumber } from '../services/documentDisplay'

export default function SubjectCard({ subject, follows, onToggle }) {
  const followed = follows.ids.includes(subject.id)
  return (
    <article className="course-card">
      <div className="course-card__topline">
        <span className="course-card__code">{subject.code}</span>
        <button type="button" className={`course-card__follow${followed ? ' course-card__follow--active' : ''}`}
          aria-pressed={followed} disabled={!follows.ready || Boolean(follows.pending)} onClick={() => onToggle ? onToggle(subject.id) : follows.toggle(subject.id)}>
          <LibraryIcon name={followed ? 'check' : 'plus'} size={15} />{follows.pending === subject.id ? 'Đang lưu…' : followed ? 'Đang theo dõi' : 'Theo dõi'}
        </button>
      </div>
      <h3><Link to={`/subjects/${subject.id}`}>{subject.name}</Link></h3>
      <p className="course-card__description">{subject.description || `Tài liệu học tập, bài giảng và đề thi môn ${subject.name}.`}</p>
      <div className="course-card__meta">
        <span title={subject.facultyName || 'Chưa cập nhật khoa'}><LibraryIcon name="building" size={16} />{subject.facultyName || 'Chưa cập nhật khoa'}</span>
        <strong>{formatDocumentNumber(subject.documentCount)} tài liệu</strong>
      </div>
      <Link className="course-card__detail" to={`/subjects/${subject.id}`}>Xem chi tiết môn học</Link>
    </article>
  )
}
