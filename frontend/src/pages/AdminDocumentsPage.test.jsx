import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminDocumentsPage from './AdminDocumentsPage'
import { getModerationDocuments, getModerationStats } from '../services/adminApi'

vi.mock('../services/adminApi', () => ({
  getModerationDocuments: vi.fn(),
  getModerationStats: vi.fn(),
  getModerationDocument: vi.fn(),
  getModerationDocumentPreview: vi.fn(),
  exportModerationDocuments: vi.fn(),
  moderateDocument: vi.fn(),
}))

afterEach(() => {
  vi.useRealTimers()
})

describe('AdminDocumentsPage automatic refresh', () => {
  it('shows a newly uploaded document without reloading the page', async () => {
    vi.useFakeTimers()
    const newDocument = {
      id: 'new-document',
      title: 'Tài liệu vừa tải lên',
      fileName: 'tai-lieu.pdf',
      fileType: 'PDF',
      fileSize: 2048,
      scanStatus: 'CLEAN',
      status: 'PENDING',
      previewStatus: 'NOT_REQUIRED',
    }

    getModerationDocuments
      .mockResolvedValueOnce({ result: { items: [], totalElements: 0 } })
      .mockResolvedValue({ result: { items: [newDocument], totalElements: 1 } })
    getModerationStats.mockResolvedValue({
      result: { pending: 1, approvedToday: 0, rejectedToday: 0, total: 1 },
    })

    render(<AdminDocumentsPage mode="moderation" />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.queryByText('Tài liệu vừa tải lên')).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(screen.getByText('Tài liệu vừa tải lên')).toBeInTheDocument()
    expect(getModerationDocuments).toHaveBeenCalledTimes(2)
  })
})
