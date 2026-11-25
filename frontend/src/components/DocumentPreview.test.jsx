import { fireEvent, render, screen } from '@testing-library/react'
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
  getDocumentPreview.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce(new Blob(['%PDF-test']))
  render(<DocumentPreview documentId="first" available />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  expect(await screen.findByTitle('Bản xem trước PDF')).toHaveAttribute('src', 'blob:preview#toolbar=0&navpanes=0&view=FitH')
})
it('releases the old URL and hides the old document while loading a new one', async () => {
  getDocumentPreview.mockResolvedValueOnce(new Blob(['%PDF-test'])).mockImplementationOnce(() => new Promise(() => {}))
  const { rerender } = render(<DocumentPreview documentId="first" available />)
  await screen.findByTitle('Bản xem trước PDF')
  rerender(<DocumentPreview documentId="second" available />)
  expect(screen.queryByTitle('Bản xem trước PDF')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toBeInTheDocument()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
})
