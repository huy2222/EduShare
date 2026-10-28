import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UploadPage from './UploadPage'
import { getAcademicCatalog, uploadDocument } from '../services/documentApi'

vi.mock('../services/documentApi', () => ({
  getAcademicCatalog: vi.fn(),
  uploadDocument: vi.fn(),
}))

describe('UploadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAcademicCatalog.mockResolvedValue({
      result: [
        {
          id: 'faculty-id',
          code: 'FIT',
          name: 'Khoa Công nghệ Thông tin',
          majors: [
            {
              id: 'major-id',
              code: 'SE',
              name: 'Kỹ thuật Phần mềm',
              subjects: [
                {
                  id: 'subject-id',
                  code: 'INT1301',
                  name: 'Cấu trúc dữ liệu và Giải thuật',
                  credits: 3,
                },
              ],
            },
          ],
        },
      ],
    })
    uploadDocument.mockResolvedValue({
      result: { title: 'Slide Cấu trúc dữ liệu', status: 'PENDING' },
    })
  })

  it('only enables submission after required data is entered and asks for confirmation', async () => {
    const { container } = render(<UploadPage authenticated />)

    await screen.findByRole('option', { name: 'Khoa Công nghệ Thông tin' })
    const submitButton = screen.getByRole('button', { name: 'Gửi tài liệu' })
    expect(submitButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Tiêu đề tài liệu/), {
      target: { value: 'Slide Cấu trúc dữ liệu' },
    })
    expect(submitButton).toBeDisabled()

    const file = new File(['pdf-content'], 'lecture.pdf', { type: 'application/pdf' })
    fireEvent.change(container.querySelector('#document-file'), { target: { files: [file] } })
    expect(submitButton).toBeEnabled()
    fireEvent.submit(container.querySelector('#upload-document-form'))

    expect(uploadDocument).not.toHaveBeenCalled()
    const confirmationDialog = screen.getByRole('dialog', { name: 'Xác nhận gửi tài liệu' })
    fireEvent.click(within(confirmationDialog).getByRole('button', { name: 'Gửi tài liệu' }))

    await waitFor(() => expect(uploadDocument).toHaveBeenCalledWith(
      {
        title: 'Slide Cấu trúc dữ liệu',
        description: null,
        documentType: 'LECTURE_NOTE',
        semester: 'FIRST',
        academicYear: '2024-2025',
        facultyId: 'faculty-id',
        majorId: 'major-id',
        subjectId: 'subject-id',
      },
      file,
    ))
    expect(await screen.findByText(/đang chờ kiểm duyệt/)).toBeInTheDocument()
  })

  it('shows an error toast when the upload fails', async () => {
    uploadDocument.mockRejectedValueOnce(new Error('R2 không phản hồi.'))
    const { container } = render(<UploadPage authenticated />)

    await screen.findByRole('option', { name: 'Khoa Công nghệ Thông tin' })
    fireEvent.change(screen.getByLabelText(/Tiêu đề tài liệu/), {
      target: { value: 'Slide Cấu trúc dữ liệu' },
    })
    fireEvent.change(container.querySelector('#document-file'), {
      target: { files: [new File(['pdf-content'], 'lecture.pdf', { type: 'application/pdf' })] },
    })
    fireEvent.submit(container.querySelector('#upload-document-form'))

    const confirmationDialog = screen.getByRole('dialog', { name: 'Xác nhận gửi tài liệu' })
    fireEvent.click(within(confirmationDialog).getByRole('button', { name: 'Gửi tài liệu' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('R2 không phản hồi.')
  })
})
