import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LibraryLayout from '../components/LibraryLayout'
import LibraryIcon from '../components/LibraryIcon'
import SubjectCard from '../components/SubjectCard'
import AcademicFilters from '../components/AcademicFilters'
import { BrowsePagination, BrowseStatus, FollowError } from '../components/BrowseControls'
import Toast, { useToast } from '../components/Toast'
import useLibraryData from '../hooks/useLibraryData'
import useBrowseParams from '../hooks/useBrowseParams'
import useSubjectFollows from '../hooks/useSubjectFollows'
import { getAcademicCatalog } from '../services/academicApi'
import { getSubjects } from '../services/subjectApi'

export default function SubjectsPage(props) {
  const { params, page, update } = useBrowseParams()
  const navigate = useNavigate()
  const { toast, notify, dismiss } = useToast()
  const follows = useSubjectFollows({ ...props, notify })
  const onlyFollowed = params.get('followed') === 'true'
  const filters = { query: params.get('query') || '', facultyId: params.get('facultyId') || '', majorId: params.get('majorId') || '' }
  const filterKey = JSON.stringify(filters)
  const [draft, setDraft] = useState(filters)
  useEffect(() => setDraft(JSON.parse(filterKey)), [filterKey])
  const catalog = useLibraryData('catalog', getAcademicCatalog)
  const resource = useLibraryData(`${filterKey}:${page}:${onlyFollowed}:${props.authenticated}:${onlyFollowed ? follows.ids.join(',') : ''}`,
    () => onlyFollowed && !props.authenticated ? Promise.resolve({ result: { items: [], total: 0 } }) : getSubjects({ ...filters, page, size: 6 }, onlyFollowed))

  return (
    <LibraryLayout {...props} activePage="subjects" breadcrumbs={[{ label: 'Khám phá môn học' }]}>
      <div className="library-heading">
        <div><h1>Khám phá môn học</h1><p>Tìm kiếm tài liệu, giáo trình và bài giảng theo từng môn học chuyên ngành</p></div>
        <button type="button" className={`library-button${onlyFollowed ? ' library-button--selected' : ''}`} aria-pressed={onlyFollowed}
          onClick={() => {
            if (!props.authenticated) navigate('/login', { state: { returnTo: '/subjects?followed=true' } })
            else update({ followed: onlyFollowed ? '' : 'true' })
          }}><LibraryIcon name="bookmark" />Môn học đã theo dõi{props.authenticated && follows.ready ? ` (${follows.ids.length})` : ''}</button>
      </div>

      <form className="library-filters library-filters--subjects" onSubmit={(event) => { event.preventDefault(); update({ ...draft, query: draft.query.trim() }) }}>
        <label className="library-search"><LibraryIcon name="search" /><input aria-label="Tìm kiếm môn học" type="search" maxLength={200} placeholder="Tìm kiếm môn học, mã môn..." value={draft.query} onChange={(event) => setDraft({ ...draft, query: event.target.value })} /></label>
        <AcademicFilters faculties={catalog.data} value={draft} onChange={(selection) => setDraft({ ...draft, ...selection })} />
        <button className="library-button library-button--primary" type="submit"><LibraryIcon name="filter" />Lọc kết quả</button>
      </form>
      {catalog.error && <p className="library-inline-error" role="alert">Không thể tải danh mục khoa/ngành. <button type="button" onClick={catalog.reload}>Thử lại</button></p>}
      <FollowError follows={follows} />
      {onlyFollowed && !props.authenticated ? <div className="library-message"><p>Đăng nhập để xem môn học đã theo dõi.</p><Link to="/login" state={{ returnTo: '/subjects?followed=true' }}>Đăng nhập</Link></div> : <>
        <BrowseStatus resource={resource} loading="Đang tải môn học…" empty={onlyFollowed ? 'Bạn chưa theo dõi môn học nào phù hợp với bộ lọc.' : 'Không tìm thấy môn học phù hợp. Hãy thử từ khóa hoặc bộ lọc khác.'} />
        {resource.data && <>
          <div className="library-grid">{resource.data.items.map((subject) => <SubjectCard key={subject.id} subject={subject} follows={follows} onToggle={async (id) => {
            const result = await follows.toggle(id)
            if (result && onlyFollowed) update({ page: 0 })
          }} />)}</div>
          <BrowsePagination page={page} total={resource.data.total} onChange={(value) => update({ page: value })} noun="môn học" />
        </>}
      </>}
      <Toast toast={toast} onDismiss={dismiss} />
    </LibraryLayout>
  )
}
