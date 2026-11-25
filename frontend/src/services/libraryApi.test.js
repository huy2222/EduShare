import { afterEach, expect, it, vi } from 'vitest'
import { downloadPublishedDocument, getDocumentPreview } from './libraryApi'

afterEach(() => vi.unstubAllGlobals())

it('fetches the guest image anonymously and the full preview with authentication cookies', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response('png', { headers: { 'Content-Type': 'image/png' } }))
    .mockResolvedValueOnce(new Response('pdf', { headers: { 'Content-Type': 'application/pdf' } }))
  vi.stubGlobal('fetch', fetchMock)
  expect((await getDocumentPreview('document')).type).toBe('image/png')
  expect((await getDocumentPreview('document', { authenticated: true })).type).toBe('application/pdf')
  expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/library/documents/document/preview', { credentials: 'omit' })
  expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/library/me/documents/document/preview', { credentials: 'include' })
})

it('sends authentication cookies to download and does not create a file when access is denied', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Vui lòng đăng nhập.' }), {
    status: 401, headers: { 'Content-Type': 'application/json' },
  }))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('URL', { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() })
  await expect(downloadPublishedDocument('document', 'java.pdf')).rejects.toThrow('Vui lòng đăng nhập.')
  expect(fetchMock).toHaveBeenCalledWith('/api/library/documents/document/download', { credentials: 'include' })
  expect(URL.createObjectURL).not.toHaveBeenCalled()
})
