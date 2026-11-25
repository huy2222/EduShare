import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import LibraryLayout from '../components/LibraryLayout'
import LibraryIcon from '../components/LibraryIcon'
import { DocumentCard } from '../components/DocumentCards'
import { BrowsePagination, BrowseStatus, FollowError } from '../components/BrowseControls'
import Toast, { useToast } from '../components/Toast'
import useBrowseParams from '../hooks/useBrowseParams'
import useLibraryData from '../hooks/useLibraryData'
import useSubjectFollows from '../hooks/useSubjectFollows'
import { getSubject } from '../services/subjectApi'
import { getPublishedDocuments } from '../services/libraryApi'
import { documentTypes, formatDocumentNumber } from '../services/documentDisplay'

export default function SubjectDetailPage(props) {
  const { id } = useParams()
  const { params, page, update } = useBrowseParams()
  const query = params.get('query') || ''
  const type = params.get('documentType') || ''
  const sort = params.get('sort') || 'newest'
  const [draft, setDraft] = useState(query)
  useEffect(() => setDraft(query), [query, id])
  const { toast, notify, dismiss } = useToast()
  const follows = useSubjectFollows({ ...props, notify })
  const detail = useLibraryData(id, () => getSubject(id))
  const resource = useLibraryData(`${id}:${query}:${type}:${sort}:${page}`, () => getPublishedDocuments(query, page, { subjectId: id, documentType: type, sort, size: 6 }))
  const subject = detail.data?.subject
  const [followerOverride, setFollowerOverride] = useState(null)
  const followerCount = followerOverride?.id === id ? followerOverride.count : subject?.followerCount || 0
  const followed = follows.ids.includes(id)

  async function share() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/subjects/${encodeURIComponent(id)}`)
      notify('Đã sao chép liên kết môn học.')
    } catch {
      notify('Không thể sao chép liên kết. Bạn có thể sao chép địa chỉ trên trình duyệt.', true)
    }
  }

  return (
    <LibraryLayout {...props} activePage="subjects" breadcrumbs={[{ label: 'Khám phá môn học', to: '/subjects' }, { label: subject?.name || 'Chi tiết môn học' }]}>
      <BrowseStatus resource={detail} loading="Đang tải môn học…" />
      {subject && <>
        <section className="library-subject-hero">
          <div>
            <div className="library-subject-tags"><span className="course-card__code">{subject.code}</span><span><LibraryIcon name="building" size={16} />{subject.facultyName || 'Chưa cập nhật khoa'}</span></div>
            <h1>{subject.name}</h1>
            <p>{subject.description || `Khám phá bài giảng, giáo trình, bài tập và đề thi của môn ${subject.name}.`}</p>
            <div className="library-subject-metrics"><span><LibraryIcon name="document" /><strong>{formatDocumentNumber(subject.documentCount)}</strong> tài liệu chia sẻ</span><span><LibraryIcon name="users" /><strong>{formatDocumentNumber(followerCount)}</strong> người theo dõi</span><span>{subject.credits} tín chỉ</span></div>
          </div>
          <div className="library-subject-actions">
            <button type="button" className="library-button library-button--primary" aria-pressed={followed} disabled={!follows.ready || Boolean(follows.pending)} onClick={async () => {
              const result = await follows.toggle(id)
              if (result) setFollowerOverride({ id, count: result.followerCount })
            }}><LibraryIcon name={followed ? 'check' : 'plus'} />{follows.pending ? 'Đang lưu…' : followed ? 'Đang theo dõi' : 'Theo dõi môn học'}</button>
            <button type="button" className="library-button" onClick={share}><LibraryIcon name="share" />Chia sẻ môn học</button>
          </div>
        </section>
        <FollowError follows={follows} />
        <div className="library-results-toolbar">
          <form onSubmit={(event) => { event.preventDefault(); update({ query: draft.trim() }) }}><label className="library-search"><LibraryIcon name="search" /><input aria-label={`Tìm kiếm tài liệu trong ${subject.name}`} type="search" maxLength={200} placeholder={`Tìm kiếm tài liệu trong ${subject.name}...`} value={draft} onChange={(event) => setDraft(event.target.value)} /></label><button className="library-button" type="submit">Tìm kiếm</button></form>
          <label className="library-sort">Sắp xếp:<select aria-label="Sắp xếp tài liệu" value={sort} onChange={(event) => update({ sort: event.target.value })}><option value="newest">Mới nhất</option><option value="popular">Lượt tải nhiều nhất</option><option value="rating">Đánh giá cao nhất</option></select></label>
        </div>
        <div className="library-type-tabs" role="group" aria-label="Lọc theo loại tài liệu">
          <button type="button" aria-pressed={!type} onClick={() => update({ documentType: '' })}>Tất cả ({formatDocumentNumber(subject.documentCount)})</button>
          {Object.entries(documentTypes).filter(([value]) => detail.data.documentTypes[value] || value === type).map(([value, label]) => <button type="button" key={value} aria-pressed={type === value} onClick={() => update({ documentType: value })}>{label} ({formatDocumentNumber(detail.data.documentTypes[value] || 0)})</button>)}
        </div>
        <BrowseStatus resource={resource} loading="Đang tải tài liệu của môn học…" empty="Chưa có tài liệu phù hợp với bộ lọc trong môn học này." />
        {resource.data && <>
          <div className="library-grid">{resource.data.items.map((document) => <DocumentCard key={document.id} document={document} showCategory />)}</div>
          <BrowsePagination page={page} total={resource.data.total} onChange={(value) => update({ page: value })} />
        </>}
      </>}
      <Toast toast={toast} onDismiss={dismiss} />
    </LibraryLayout>
  )
}
