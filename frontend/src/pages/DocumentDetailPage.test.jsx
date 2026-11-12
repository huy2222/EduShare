import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import HomePage from './HomePage'
import DocumentDetailPage from './DocumentDetailPage'
import * as library from '../services/libraryApi'

vi.mock('../services/libraryApi')

const document = {
  id: '7b1cc9ba-4c76-4f73-8c6e-7189a5b21514',
  title: 'Ôn tập Java',
  author: 'Nguyễn Văn A',
  fileType: 'PDF',
  fileName: 'java.pdf',
  fileSize: 4096,
  subjectName: 'Lập trình Java',
  subjectCode: 'JAVA101',
  createdAt: '2026-11-12T10:00:00',
  averageRating: 0,
  views: 1,
  downloads: 0,
}

const emptyRatings = { average: 0, total: 0, counts: [0, 0, 0, 0, 0, 0] }
const page = (items) => ({ result: { items, total: items.length, hasNext: false } })
const path = `/documents/${document.id}`

function open(initialPath, authenticated = false) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage authenticated={authenticated} />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  library.getPublishedDocuments.mockResolvedValue(page([document]))
  library.getPublishedDocument.mockResolvedValue({
    result: { document, ratings: emptyRatings, previewAvailable: false },
  })
  library.getDocumentComments.mockResolvedValue(page([]))
  library.getDocumentViewer.mockResolvedValue({ result: { favorite: false, rating: null } })
})

it('opens an approved document from the public homepage and prompts guests to sign in to interact', async () => {
  open('/')
  fireEvent.click(await screen.findByRole('link', { name: 'Xem chi tiết' }))
  expect(await screen.findByRole('heading', { name: document.title })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Đăng nhập để bình luận' })).toHaveAttribute('href', '/login')
  expect(screen.getByRole('link', { name: 'Đăng nhập để đánh giá' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '♡ Đăng nhập để lưu' })).toBeInTheDocument()
  expect(await screen.findByText('Chưa có bình luận.')).toBeInTheDocument()
  expect(library.getDocumentViewer).not.toHaveBeenCalled()
})

it('saves an explicit zero-star rating, favorites, and posts a comment for a signed-in reader', async () => {
  library.rateDocument.mockResolvedValue({
    result: { ...emptyRatings, total: 1, counts: [1, 0, 0, 0, 0, 0] },
  })
  library.setDocumentFavorite.mockResolvedValue({})
  library.postDocumentComment.mockImplementation(async () => {
    library.getDocumentComments.mockResolvedValue(page([
      { id: 'comment', author: 'Nguyễn Văn A', body: 'Dễ hiểu!', createdAt: document.createdAt },
    ]))
  })
  open(path, true)
  const favorite = await screen.findByRole('button', { name: '♡ Thêm vào yêu thích' })
  await waitFor(() => expect(favorite).toBeEnabled())

  fireEvent.click(screen.getByRole('radio', { name: '0 sao' }))
  fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }))
  expect(await screen.findByText('Đã lưu đánh giá của bạn.')).toBeInTheDocument()
  expect(library.rateDocument).toHaveBeenCalledWith(document.id, 0)

  fireEvent.click(favorite)
  expect(await screen.findByRole('button', { name: '♥ Đã yêu thích' })).toHaveAttribute('aria-pressed', 'true')
  expect(library.setDocumentFavorite).toHaveBeenCalledWith(document.id, true)

  fireEvent.change(screen.getByLabelText('Bình luận của bạn'), { target: { value: 'Dễ hiểu!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi bình luận' }))
  expect(await screen.findByText('Dễ hiểu!')).toBeInTheDocument()
  expect(library.postDocumentComment).toHaveBeenCalledWith(document.id, 'Dễ hiểu!', undefined)
})

it('posts a reply in its thread and toggles its like', async () => {
  const root = { id: 'root', author: document.author, body: 'Bạn có đáp án không?', createdAt: document.createdAt }
  const reply = { id: 'reply', author: document.author, body: 'Có trong trang cuối.', createdAt: document.createdAt }
  library.getDocumentComments.mockImplementation(async (_id, _page, { parentId }) =>
    page(parentId ? [reply] : [root]))
  library.postDocumentComment.mockResolvedValue({ result: reply })
  library.setDocumentCommentLike
    .mockResolvedValueOnce({ result: { liked: true, likeCount: 1 } })
    .mockResolvedValueOnce({ result: { liked: false, likeCount: 0 } })
  open(path, true)

  fireEvent.click(await screen.findByRole('button', { name: 'Trả lời' }))
  fireEvent.change(screen.getByLabelText('Nội dung trả lời'), { target: { value: reply.body } })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi trả lời' }))
  const replyBody = await screen.findByText(reply.body, { selector: 'p' })
  expect(library.postDocumentComment).toHaveBeenCalledWith(document.id, reply.body, root.id)
  const replyLike = within(replyBody.closest('li')).getByRole('button')
  fireEvent.click(replyLike)
  expect(library.setDocumentCommentLike).toHaveBeenNthCalledWith(1, document.id, reply.id, true)
  await waitFor(() => expect(replyLike).toHaveAttribute('aria-pressed', 'true'))
  expect(replyLike).toHaveTextContent('Đã thích (1)')
  fireEvent.click(replyLike)
  await waitFor(() => expect(replyLike).toHaveAttribute('aria-pressed', 'false'))
  expect(library.setDocumentCommentLike).toHaveBeenNthCalledWith(2, document.id, reply.id, false)
})
