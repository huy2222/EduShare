import { useEffect, useState } from 'react'
import LibraryLayout from '../components/LibraryLayout'
import LibraryIcon from '../components/LibraryIcon'
import AcademicFilters from '../components/AcademicFilters'
import { DocumentCard } from '../components/DocumentCards'
import { BrowsePagination, BrowseStatus } from '../components/BrowseControls'
import useBrowseParams from '../hooks/useBrowseParams'
import useLibraryData from '../hooks/useLibraryData'
import { getAcademicCatalog } from '../services/academicApi'
import { getPublishedDocuments } from '../services/libraryApi'
import { documentTypes, formatDocumentNumber } from '../services/documentDisplay'

export default function ExplorePage(props) {
  const { params, page, update } = useBrowseParams()
  const filters = { query: params.get('query') || '', facultyId: params.get('facultyId') || '', majorId: params.get('majorId') || '', documentType: params.get('documentType') || '', fileType: params.get('fileType') || '', subjectId: params.get('subjectId') || '' }
  const sort = params.get('sort') || 'newest'
  const filterKey = JSON.stringify(filters)
  const [draft, setDraft] = useState(filters)
  useEffect(() => setDraft(JSON.parse(filterKey)), [filterKey])
  const catalog = useLibraryData('catalog', getAcademicCatalog)
  const resource = useLibraryData(`${filterKey}:${sort}:${page}`, () => getPublishedDocuments(filters.query, page, { ...filters, size: 6, sort }))
  const faculties = (catalog.data || []).filter((faculty) => !draft.facultyId || faculty.id === draft.facultyId)
  const availableSubjects = [...new Map(faculties.flatMap((faculty) => faculty.majors)
    .filter((major) => !draft.majorId || major.id === draft.majorId).flatMap((major) => major.subjects)
    .map((subject) => [subject.id, subject])).values()]

  return (
    <LibraryLayout {...props} activePage="explore" breadcrumbs={[{ label: 'Khám phá tài liệu' }]}>
      <div className="library-heading"><div><h1>Khám phá tài liệu</h1><p>Tìm bài giảng, đề thi, giáo trình và tài liệu học tập từ cộng đồng sinh viên</p></div></div>
      <form className="library-filters library-filters--documents" onSubmit={(event) => { event.preventDefault(); update({ ...draft, query: draft.query.trim() }) }}>
        <label className="library-search"><LibraryIcon name="search" /><input aria-label="Tìm kiếm tài liệu" type="search" maxLength={200} placeholder="Tìm kiếm tài liệu, môn học, mã môn..." value={draft.query} onChange={(event) => setDraft({ ...draft, query: event.target.value })} /></label>
        <AcademicFilters faculties={catalog.data} value={draft} onChange={(selection) => setDraft({ ...draft, ...selection, subjectId: '' })} />
        <label className="library-select">
          <span className="sr-only">Môn học</span>
          <select aria-label="Môn học" disabled={!catalog.data} value={draft.subjectId} onChange={(event) => setDraft({ ...draft, subjectId: event.target.value })}>
            <option value="">Tất cả môn học</option>
            {draft.subjectId && !availableSubjects.some((subject) => subject.id === draft.subjectId) && <option value={draft.subjectId}>Môn học đã chọn</option>}
            {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
          </select>
        </label>
        <label className="library-select">
          <span className="sr-only">Loại tài liệu</span>
          <select aria-label="Loại tài liệu" value={draft.documentType} onChange={(event) => setDraft({ ...draft, documentType: event.target.value })}>
            <option value="">Tất cả loại tài liệu</option>
            {Object.entries(documentTypes).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select>
        </label>
        <label className="library-select">
          <span className="sr-only">Định dạng</span>
          <select aria-label="Định dạng" value={draft.fileType} onChange={(event) => setDraft({ ...draft, fileType: event.target.value })}>
            <option value="">Tất cả định dạng</option>
            {['PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX'].map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <button className="library-button library-button--primary" type="submit"><LibraryIcon name="filter" />Lọc kết quả</button>
      </form>
      {catalog.error && <p className="library-inline-error" role="alert">Không thể tải danh mục khoa/ngành. <button type="button" onClick={catalog.reload}>Thử lại</button></p>}
      <div className="library-results-toolbar">
        <p>{resource.data ? `${formatDocumentNumber(resource.data.total)} tài liệu${filters.query ? ` cho “${filters.query}”` : ''}` : 'Kho tài liệu học tập'} <button className="library-reset" type="button" onClick={() => update(Object.fromEntries([...Object.keys(filters), 'sort'].map((key) => [key, ''])))}>Xóa bộ lọc</button></p>
        <label className="library-sort">Sắp xếp:<select aria-label="Sắp xếp tài liệu" value={sort} onChange={(event) => update({ sort: event.target.value })}><option value="newest">Mới nhất</option><option value="popular">Lượt tải nhiều nhất</option><option value="rating">Đánh giá cao nhất</option></select></label>
      </div>
      <BrowseStatus resource={resource} loading="Đang tìm tài liệu…" empty="Không tìm thấy tài liệu phù hợp. Hãy thử từ khóa hoặc bộ lọc khác." />
      {resource.data && <>
        <div className="library-grid">{resource.data.items.map((document) => <DocumentCard key={document.id} document={document} showCategory />)}</div>
        <BrowsePagination page={page} total={resource.data.total} onChange={(value) => update({ page: value })} />
      </>}
    </LibraryLayout>
  )
}
