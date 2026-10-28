import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearCsrfToken } from './apiClient'
import { uploadDocument } from './documentApi'

describe('documentApi', () => {
  afterEach(() => {
    clearCsrfToken()
    vi.unstubAllGlobals()
  })

  it('uploads metadata and file as multipart without overriding the browser boundary', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          code: 1000,
          result: { token: 'csrf-token', headerName: 'X-XSRF-TOKEN' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          code: 1000,
          result: { id: 'document-id', status: 'PENDING' },
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const metadata = {
      title: 'Lecture 1',
      documentType: 'LECTURE_NOTE',
      facultyId: 'faculty-id',
      majorId: 'major-id',
      subjectId: 'subject-id',
    }
    const file = new File(['content'], 'lecture.pdf', { type: 'application/pdf' })

    await uploadDocument(metadata, file)

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/csrf', {
      credentials: 'include',
    })
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/documents/upload')
    expect(options.method).toBe('POST')
    expect(options.credentials).toBe('include')
    expect(options.headers).toEqual({ 'X-XSRF-TOKEN': 'csrf-token' })
    expect(options.headers['Content-Type']).toBeUndefined()
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('file')).toBe(file)
    expect(options.body.get('metadata').type).toBe('application/json')
  })
})
