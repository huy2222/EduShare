import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import DocumentPreview from './DocumentPreview'
import { getDocumentPreview } from '../services/libraryApi'
vi.mock('../services/libraryApi', () => ({ getDocumentPreview: vi.fn() }))
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() })
})
afterEach(() => vi.unstubAllGlobals())
it('retries a failed request and displays the PDF', async () => {
  getDocumentPreview.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce(new Blob(['%PDF-test'], { type: 'application/pdf' }))
  render(<DocumentPreview documentId="first" available authenticated />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  expect(await screen.findByTitle('Bản xem trước PDF')).toHaveAttribute('src', 'blob:preview#toolbar=0&navpanes=0&view=FitH')
  expect(getDocumentPreview).toHaveBeenLastCalledWith('first', { authenticated: true })
})
it('releases the old URL and hides the old document while loading a new one', async () => {
  getDocumentPreview.mockResolvedValueOnce(new Blob(['%PDF-test'], { type: 'application/pdf' })).mockImplementationOnce(() => new Promise(() => {}))
  const { rerender } = render(<DocumentPreview documentId="first" available authenticated />)
  await screen.findByTitle('Bản xem trước PDF')
  rerender(<DocumentPreview documentId="second" available authenticated />)
  expect(screen.queryByTitle('Bản xem trước PDF')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toBeInTheDocument()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
})

it('shows only the guest image and a sign-in link, without embedding a PDF', async () => {
  getDocumentPreview.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
  render(<MemoryRouter><DocumentPreview documentId="first" available /></MemoryRouter>)
  expect(await screen.findByRole('img')).toHaveAttribute('src', 'blob:preview')
  expect(getDocumentPreview).toHaveBeenCalledWith('first', { authenticated: false })
  expect(screen.queryByTitle('Bản xem trước PDF')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Đăng nhập để xem đầy đủ' })).toHaveAttribute('href', '/login')
})

it('rejects a full PDF returned to a guest instead of exposing it as a preview', async () => {
  getDocumentPreview.mockResolvedValue(new Blob(['%PDF-full'], { type: 'application/pdf' }))
  render(<MemoryRouter><DocumentPreview documentId="first" available /></MemoryRouter>)
  expect(await screen.findByRole('alert')).toHaveTextContent('Định dạng bản xem trước không hợp lệ.')
  expect(URL.createObjectURL).not.toHaveBeenCalled()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.queryByTitle('Bản xem trước PDF')).not.toBeInTheDocument()
})

it('immediately hides and releases the full preview when the reader signs out', async () => {
  getDocumentPreview.mockResolvedValueOnce(new Blob(['%PDF-full'], { type: 'application/pdf' }))
    .mockImplementationOnce(() => new Promise(() => {}))
  const { rerender } = render(<MemoryRouter><DocumentPreview documentId="first" available authenticated /></MemoryRouter>)
  await screen.findByTitle('Bản xem trước PDF')
  rerender(<MemoryRouter><DocumentPreview documentId="first" available authenticated={false} /></MemoryRouter>)
  expect(screen.queryByTitle('Bản xem trước PDF')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toBeInTheDocument()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  expect(getDocumentPreview).toHaveBeenLastCalledWith('first', { authenticated: false })
})

it('ignores a late full-preview response after the reader signs out', async () => {
  let resolveFull
  getDocumentPreview.mockImplementationOnce(() => new Promise((resolve) => { resolveFull = resolve }))
    .mockResolvedValueOnce(new Blob(['png'], { type: 'image/png' }))
  const { rerender } = render(<MemoryRouter><DocumentPreview documentId="first" available authenticated /></MemoryRouter>)
  rerender(<MemoryRouter><DocumentPreview documentId="first" available authenticated={false} /></MemoryRouter>)
  await screen.findByRole('img')
  await act(async () => { resolveFull(new Blob(['%PDF-full'], { type: 'application/pdf' })) })
  expect(screen.queryByTitle('Bản xem trước PDF')).not.toBeInTheDocument()
  expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
})
