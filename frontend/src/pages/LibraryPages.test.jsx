import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import SubjectsPage from './SubjectsPage'
import SubjectDetailPage from './SubjectDetailPage'
import ExplorePage from './ExplorePage'
import * as subjects from '../services/subjectApi'
import { getAcademicCatalog } from '../services/academicApi'
import { getPublishedDocuments } from '../services/libraryApi'

vi.mock('../services/subjectApi')
vi.mock('../services/academicApi')
vi.mock('../services/libraryApi')

const subject = { id: '8c20f9bb-2493-41b0-93ba-bad33bb231c1', code: 'INT1301', name: 'Lập trình Java', description: 'Kiến thức lập trình hướng đối tượng.', facultyId: 'it', facultyName: 'Công nghệ thông tin', documentCount: 7, followerCount: 2, credits: 3 }
const document = { id: 'java-exam', title: 'Đề thi Java', documentType: 'EXAM', fileType: 'PDF', fileSize: 2048, downloads: 10, averageRating: 4.5, author: 'Nguyễn Văn A', createdAt: '2026-11-12T10:00:00', subjectCode: subject.code, subjectName: subject.name }
const page = (items, total = items.length) => ({ result: { items, total, hasNext: total > 6 } })
const props = { authenticated: true, currentUser: { id: 'reader' } }
function LoginTarget() { const { state } = useLocation(); return <p>Đăng nhập: {state?.returnTo}</p> }
function open(path = '/subjects', shared = props) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/subjects" element={<SubjectsPage {...shared} />} />
    <Route path="/subjects/:id" element={<SubjectDetailPage {...shared} />} />
    <Route path="/explore" element={<ExplorePage {...shared} />} />
    <Route path="/documents/:id" element={<h1>Chi tiết tài liệu</h1>} />
    <Route path="/login" element={<LoginTarget />} />
  </Routes></MemoryRouter>)
}

beforeEach(() => {
  vi.resetAllMocks()
  subjects.getSubjects.mockResolvedValue(page([subject], 7))
  subjects.getSubject.mockResolvedValue({ result: { subject, documentTypes: { EXAM: 4, LECTURE_NOTE: 3 } } })
  subjects.getFollowedSubjectIds.mockResolvedValue({ result: [] })
  getPublishedDocuments.mockResolvedValue(page([document], 7))
  getAcademicCatalog.mockResolvedValue({ result: [
    { id: 'it', name: 'Công nghệ thông tin', majors: [{ id: 'se', name: 'Kỹ thuật phần mềm', subjects: [subject] }] },
    { id: 'eco', name: 'Kinh tế', majors: [{ id: 'business', name: 'Quản trị kinh doanh', subjects: [] }] },
  ] })
})

it('uses real subject cards and combines search, faculty, major and pagination, resetting the page on new filters', async () => {
  open()
  await screen.findByRole('heading', { name: subject.name })
  await waitFor(() => expect(screen.getByLabelText('Khoa')).toBeEnabled())
  fireEvent.change(screen.getByLabelText('Tìm kiếm môn học'), { target: { value: 'Java' } })
  fireEvent.change(screen.getByLabelText('Khoa'), { target: { value: 'it' } })
  fireEvent.change(screen.getByLabelText('Chuyên ngành'), { target: { value: 'se' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lọc kết quả' }))
  await waitFor(() => expect(subjects.getSubjects).toHaveBeenLastCalledWith({ query: 'Java', facultyId: 'it', majorId: 'se', page: 0, size: 6 }, false))
  fireEvent.click(await screen.findByRole('button', { name: 'Trang 2' }))
  await waitFor(() => expect(subjects.getSubjects).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }), false))
  fireEvent.change(screen.getByLabelText('Khoa'), { target: { value: 'eco' } })
  expect(screen.getByLabelText('Chuyên ngành')).toHaveValue('')
  fireEvent.click(screen.getByRole('button', { name: 'Lọc kết quả' }))
  await waitFor(() => expect(subjects.getSubjects).toHaveBeenLastCalledWith(expect.objectContaining({ facultyId: 'eco', majorId: '', page: 0 }), false))
})

it('persists follows across mounts and filters the list to followed subjects', async () => {
  let ids = []
  subjects.getFollowedSubjectIds.mockImplementation(async () => ({ result: ids }))
  subjects.setSubjectFollow.mockImplementation(async (id, followed) => {
    ids = followed ? [id] : []
    return { result: { followed, followerCount: ids.length } }
  })
  subjects.getSubjects.mockImplementation(async (_filters, followedOnly) => page(followedOnly && !ids.length ? [] : [subject]))
  const { unmount } = open()
  const follow = await screen.findByRole('button', { name: 'Theo dõi', exact: true })
  await waitFor(() => expect(follow).toBeEnabled())
  fireEvent.click(follow)
  expect(await screen.findByRole('button', { name: 'Đang theo dõi' })).toHaveAttribute('aria-pressed', 'true')
  expect(subjects.setSubjectFollow).toHaveBeenCalledWith(subject.id, true)
  unmount()
  open()
  expect(await screen.findByRole('button', { name: 'Đang theo dõi' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Môn học đã theo dõi (1)' }))
  await waitFor(() => expect(subjects.getSubjects).toHaveBeenLastCalledWith(expect.any(Object), true))
  fireEvent.click(await screen.findByRole('button', { name: 'Đang theo dõi' }))
  expect(await screen.findByText('Bạn chưa theo dõi môn học nào phù hợp với bộ lọc.')).toBeInTheDocument()
})

it('prompts guests to sign in and retains the subject detail as the return destination', async () => {
  open(`/subjects/${subject.id}`, { authenticated: false })
  fireEvent.click(await screen.findByRole('button', { name: 'Theo dõi môn học' }))
  expect(await screen.findByText(`Đăng nhập: /subjects/${subject.id}`)).toBeInTheDocument()
  expect(subjects.setSubjectFollow).not.toHaveBeenCalled()
})

it('keeps the follow state unchanged when saving fails and displays a popup', async () => {
  subjects.setSubjectFollow.mockRejectedValue(new Error('Không thể theo dõi lúc này.'))
  open()
  const follow = await screen.findByRole('button', { name: 'Theo dõi', exact: true })
  await waitFor(() => expect(follow).toBeEnabled())
  fireEvent.click(follow)
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể theo dõi lúc này.')
  expect(follow).toHaveAttribute('aria-pressed', 'false')
})

it('opens a subject, filters its documents by category/search/sort, and opens document details', async () => {
  open()
  fireEvent.click(await screen.findByRole('link', { name: 'Xem chi tiết môn học' }))
  expect(await screen.findByRole('heading', { name: subject.name, level: 1 })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Đề thi (4)' }))
  await waitFor(() => expect(getPublishedDocuments).toHaveBeenLastCalledWith('', 0, { subjectId: subject.id, documentType: 'EXAM', sort: 'newest', size: 6 }))
  fireEvent.change(screen.getByLabelText(`Tìm kiếm tài liệu trong ${subject.name}`), { target: { value: 'giữa kỳ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm', exact: true }))
  fireEvent.change(screen.getByLabelText('Sắp xếp tài liệu'), { target: { value: 'popular' } })
  await waitFor(() => expect(getPublishedDocuments).toHaveBeenLastCalledWith('giữa kỳ', 0, expect.objectContaining({ subjectId: subject.id, documentType: 'EXAM', sort: 'popular' })))
  fireEvent.click(await screen.findByRole('link', { name: 'Xem chi tiết', exact: true }))
  expect(screen.getByRole('heading', { name: 'Chi tiết tài liệu' })).toBeInTheDocument()
})

it('explores documents using combined filters and preserves them when changing sort', async () => {
  open('/explore?query=java')
  await screen.findByText(document.title)
  fireEvent.change(screen.getByLabelText('Loại tài liệu'), { target: { value: 'EXAM' } })
  fireEvent.change(screen.getByLabelText('Định dạng'), { target: { value: 'PDF' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lọc kết quả' }))
  fireEvent.change(screen.getByLabelText('Sắp xếp tài liệu'), { target: { value: 'rating' } })
  await waitFor(() => expect(getPublishedDocuments).toHaveBeenLastCalledWith('java', 0, expect.objectContaining({ documentType: 'EXAM', fileType: 'PDF', sort: 'rating', size: 6 })))
  expect(screen.getByRole('link', { name: 'Khám phá tài liệu', exact: true, current: 'page' })).toBeInTheDocument()
})

it('recovers from a failed subject list request using the retry action', async () => {
  subjects.getSubjects.mockRejectedValueOnce(new Error('Máy chủ bận.')).mockResolvedValueOnce(page([subject]))
  open()
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Máy chủ bận.')
  fireEvent.click(within(alert).getByRole('button', { name: 'Thử lại' }))
  expect(await screen.findByRole('heading', { name: subject.name })).toBeInTheDocument()
})

it('makes a subject filter from the homepage visible and lets readers clear it', async () => {
  open(`/explore?subjectId=${subject.id}`)
  await waitFor(() => expect(screen.getByLabelText('Môn học')).toBeEnabled())
  expect(screen.getByLabelText('Môn học')).toHaveValue(subject.id)
  fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
  await waitFor(() => expect(getPublishedDocuments).toHaveBeenLastCalledWith('', 0, expect.objectContaining({ subjectId: '' })))
  expect(screen.getByLabelText('Môn học')).toHaveValue('')
})
