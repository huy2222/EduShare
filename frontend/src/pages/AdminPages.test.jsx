import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminPages from './AdminPages'
import { getCurrentUser } from '../services/authApi'
import * as api from '../services/adminApi'

vi.mock('../services/authApi', () => ({ getCurrentUser: vi.fn() }))
vi.mock('../services/adminApi', () => ({
  getOverview: vi.fn(),
  getRoles: vi.fn(),
  getUsers: vi.fn(),
  updateUser: vi.fn(),
  getCatalog: vi.fn(),
  getCatalogDetail: vi.fn(),
  saveCatalog: vi.fn(),
  deleteCatalog: vi.fn(),
  getModerationDocuments: vi.fn(),
  getModerationStats: vi.fn(),
  getModerationDocument: vi.fn(),
  getModerationDocumentPreview: vi.fn(),
  exportModerationDocuments: vi.fn(),
  moderateDocument: vi.fn(),
}))

const pageResponse = (items) =>
  Promise.resolve({
    result: { items, page: 0, size: 10, totalElements: items.length },
  })

function open(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/:section?" element={<AdminPages />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
  getCurrentUser.mockResolvedValue({
    result: { id: 'admin', fullName: 'Admin', roles: ['ADMIN'] },
  })
})

describe('Admin workspace', () => {
  it('requests only the current page and does not load form options before editing', async () => {
    api.getCatalog.mockImplementation((type, filters) =>
      Promise.resolve({
        result: {
          items: [
            {
              id: `s${filters.page}`,
              code: `S${filters.page}`,
              name: `Môn trang ${filters.page}`,
              credits: 3,
              facultyName: 'Khoa Toán',
            },
          ],
          totalElements: 11,
          page: filters.page,
          size: 10,
        },
      }),
    )
    open('/admin/subjects')
    expect(await screen.findByText('Môn trang 0')).toBeInTheDocument()
    expect(api.getCatalog).not.toHaveBeenCalledWith(
      'faculties',
      expect.anything(),
    )
    expect(api.getCatalogDetail).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
    expect(await screen.findByText('Môn trang 1')).toBeInTheDocument()
    expect(api.getCatalog).toHaveBeenCalledWith(
      'subjects',
      expect.objectContaining({ page: 1, size: 10 }),
    )
    fireEvent.change(screen.getByLabelText('Tìm môn học'), {
      target: { value: 'Toán' },
    })
    await waitFor(() =>
      expect(api.getCatalog).toHaveBeenCalledWith(
        'subjects',
        expect.objectContaining({ search: 'Toán', page: 0 }),
      ),
    )
  })

  it('loads subject detail only when editing and preserves previously selected majors', async () => {
    api.getCatalog.mockImplementation((type) =>
      pageResponse(
        type === 'subjects'
          ? [
              {
                id: 's1',
                code: 'S1',
                name: 'Toán',
                credits: 3,
                facultyId: 'f1',
                facultyName: 'Khoa Toán',
              },
            ]
          : [],
      ),
    )
    api.getCatalogDetail.mockResolvedValue({
      result: {
        id: 's1',
        code: 'S1',
        name: 'Toán',
        credits: 3,
        facultyId: 'f1',
        facultyName: 'Khoa Toán',
        description: 'Chi tiết',
        majors: [{ id: 'm1', name: 'Ngành đã chọn', facultyName: 'Khoa khác' }],
      },
    })
    api.saveCatalog.mockResolvedValue({})
    open('/admin/subjects')
    fireEvent.click(await screen.findByRole('button', { name: 'Sửa' }))
    expect(
      await screen.findByRole('checkbox', { name: /Ngành đã chọn/ }),
    ).toBeChecked()
    expect(api.getCatalogDetail).toHaveBeenCalledWith('subjects', 's1')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(api.saveCatalog).toHaveBeenCalledWith(
        'subjects',
        expect.objectContaining({ majorIds: ['m1'] }),
      ),
    )
  })
  it('reuses the account loaded by App without another authentication request', async () => {
    api.getOverview.mockResolvedValue({
      result: { users: 0, activeUsers: 0, lockedUsers: 0 },
    })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminPages
                currentUser={{ id: 'admin', roles: ['ADMIN'] }}
                authLoading={false}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Trạng thái tài khoản')).toBeInTheDocument()
    expect(getCurrentUser).not.toHaveBeenCalled()
  })

  it('opens the selected faculty and creates a major inside it', async () => {
    api.getCatalog.mockImplementation((type) =>
      pageResponse(
        type === 'faculties'
          ? [
              {
                id: 'f1',
                code: 'IT',
                name: 'Công nghệ thông tin',
                majors: [],
              },
            ]
          : type === 'majors'
            ? [
                {
                  id: 'm2',
                  name: 'Kỹ thuật phần mềm',
                  facultyName: 'Khoa CNTT',
                },
              ]
            : [],
      ),
    )
    api.saveCatalog.mockResolvedValue({})
    open('/admin/faculties')
    fireEvent.click(await screen.findByRole('button', { name: 'Xem ngành' }))
    fireEvent.click(
      await screen.findByRole('button', { name: '＋ Thêm ngành' }),
    )
    fireEvent.change(screen.getByLabelText('Mã ngành'), {
      target: { value: 'SE' },
    })
    fireEvent.change(screen.getByLabelText('Tên ngành'), {
      target: { value: 'Kỹ thuật phần mềm' },
    })
    expect(screen.getByLabelText('Khoa', { exact: true })).toHaveValue('f1')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(api.saveCatalog).toHaveBeenCalledWith(
        'majors',
        expect.objectContaining({ code: 'SE', facultyId: 'f1' }),
      ),
    )
    expect(await screen.findByText('Đã lưu ngành.')).toBeInTheDocument()
  })

  it('keeps cross-faculty major selections when the managing faculty changes', async () => {
    api.getCatalog.mockImplementation((type) =>
      pageResponse(
        type === 'faculties'
          ? [
              { id: 'f1', name: 'Khoa Toán', majors: [] },
              {
                id: 'f2',
                name: 'Khoa CNTT',
                majors: [{ id: 'm2', name: 'Kỹ thuật phần mềm' }],
              },
            ]
          : type === 'majors'
            ? [
                {
                  id: 'm2',
                  name: 'Kỹ thuật phần mềm',
                  facultyName: 'Khoa CNTT',
                },
              ]
            : [],
      ),
    )
    api.saveCatalog.mockResolvedValue({})
    open('/admin/subjects')
    fireEvent.click(
      await screen.findByRole('button', { name: '＋ Thêm môn học' }),
    )
    fireEvent.change(screen.getByLabelText('Mã môn học'), {
      target: { value: 'MATH1' },
    })
    fireEvent.change(screen.getByLabelText('Tên môn học'), {
      target: { value: 'Toán cao cấp' },
    })
    fireEvent.click(
      await screen.findByRole('checkbox', { name: /Kỹ thuật phần mềm/ }),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: /Công nghệ thông tin|Khoa Toán/ }),
      ).toBeInTheDocument(),
    )
    fireEvent.change(await screen.findByLabelText('Khoa', { exact: true }), {
      target: { value: 'f1' },
    })
    expect(
      screen.getByRole('checkbox', { name: /Kỹ thuật phần mềm/ }),
    ).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(api.saveCatalog).toHaveBeenCalledWith(
        'subjects',
        expect.objectContaining({ facultyId: 'f1', majorIds: ['m2'] }),
      ),
    )
  })

  it('denies users without the admin role', async () => {
    getCurrentUser.mockResolvedValue({ result: { roles: ['USER'] } })
    open('/admin')
    expect(
      await screen.findByText('Bạn không có quyền quản trị'),
    ).toBeInTheDocument()
    expect(api.getOverview).not.toHaveBeenCalled()
  })

  it('does not expose document moderation to a normal user with document view access', async () => {
    getCurrentUser.mockResolvedValue({
      result: { roles: ['USER'], permissions: ['DOCUMENT_VIEW'] },
    })
    open('/admin/moderation')
    expect(
      await screen.findByText('Bạn không có quyền quản trị'),
    ).toBeInTheDocument()
    expect(api.getModerationDocuments).not.toHaveBeenCalled()
  })

  it('requires a reason before rejecting a document', async () => {
    const document = {
      id: 'doc-1',
      title: 'Giáo trình kiểm thử',
      description: 'Mô tả không được hiển thị trong danh sách',
      fileName: 'giao-trinh.txt',
      fileType: 'TXT',
      fileSize: 1024,
      uploaderName: 'Nguyễn An',
      uploaderEmail: 'an@example.com',
      facultyName: 'Khoa Công nghệ Thông tin',
      majorName: 'Kỹ thuật phần mềm',
      scanStatus: 'CLEAN',
      status: 'PENDING',
      previewStatus: 'NOT_REQUIRED',
    }
    api.getModerationDocuments.mockResolvedValue({ result: { items: [document] } })
    api.getModerationStats.mockResolvedValue({
      result: { pending: 12, approvedToday: 7, rejectedToday: 2, total: 4820 },
    })
    api.getModerationDocument.mockResolvedValue({ result: document })
    api.moderateDocument.mockResolvedValue({})

    const { container } = open('/admin/moderation')
    expect(await screen.findByText('4.820')).toBeInTheDocument()
    expect(container.querySelector('.moderation-file-type-badge')).toHaveTextContent('TXT')
    expect(screen.queryByText('Mô tả không được hiển thị trong danh sách')).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'QUÉT VIRUS' })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'KHOA' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'NGÀNH' })).toBeInTheDocument()
    expect(screen.getByText('Khoa Công nghệ Thông tin')).toBeInTheDocument()
    expect(screen.getByText('Kỹ thuật phần mềm')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Kiểm duyệt' }))
    const moderationActions = await screen.findByLabelText('Thao tác kiểm duyệt')
    expect(moderationActions).toBeInTheDocument()
    expect(container.querySelector('.moderation-review-bar')).not.toBeInTheDocument()
    fireEvent.click(within(moderationActions).getByRole('button', { name: /Từ chối/ }))

    expect(await screen.findByRole('dialog', { name: 'Lý do từ chối tài liệu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xác nhận từ chối' })).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox', { name: /Lý do từ chối/ }), {
      target: { value: 'Nội dung không đúng môn học.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }))

    await waitFor(() =>
      expect(api.moderateDocument).toHaveBeenCalledWith(
        'doc-1',
        'REJECTED',
        'Nội dung không đúng môn học.',
      ),
    )
  })

  it('shows immediate loading feedback while opening document details', async () => {
    const document = {
      id: 'doc-loading',
      title: 'Tài liệu đang tải',
      fileName: 'tai-lieu.txt',
      fileType: 'TXT',
      fileSize: 2048,
      scanStatus: 'CLEAN',
      status: 'PENDING',
      previewStatus: 'NOT_REQUIRED',
    }
    let resolveDetail
    api.getModerationDocuments.mockResolvedValue({
      result: { items: [document], totalElements: 1 },
    })
    api.getModerationStats.mockResolvedValue({
      result: { pending: 1, approved: 0, rejected: 0, total: 1 },
    })
    api.getModerationDocument.mockImplementation(
      () => new Promise((resolve) => { resolveDetail = resolve }),
    )

    open('/admin/moderation')
    fireEvent.click(await screen.findByRole('button', { name: 'Kiểm duyệt' }))
    expect(
      screen.getByRole('status', { name: 'Đang mở màn hình kiểm duyệt…' }),
    ).toBeInTheDocument()

    resolveDetail({ result: document })
    expect(await screen.findByRole('dialog', { name: 'Tài liệu đang tải' })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('status', { name: 'Đang mở màn hình kiểm duyệt…' })).not.toBeInTheDocument(),
    )
  })

  it('keeps document management separate from the moderation workflow', async () => {
    const document = {
      id: 'doc-approved',
      title: 'Tài liệu đã xuất bản',
      fileName: 'published.txt',
      fileType: 'TXT',
      scanStatus: 'CLEAN',
      status: 'APPROVED',
      previewStatus: 'NOT_REQUIRED',
    }
    api.getModerationDocuments.mockResolvedValue({
      result: { items: [document], totalElements: 1 },
    })
    api.getModerationStats.mockResolvedValue({
      result: { pending: 0, approved: 1, rejected: 0, total: 1 },
    })
    api.getModerationDocument.mockResolvedValue({ result: document })

    open('/admin/documents')
    expect(await screen.findByRole('heading', { name: 'Quản lý tài liệu' })).toBeInTheDocument()
    const detailButton = await screen.findByRole('button', { name: 'Chi tiết' })
    expect(detailButton).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Kiểm duyệt' })).not.toBeInTheDocument()
    expect(screen.queryByText('Duyệt đã chọn')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Chọn tất cả tài liệu an toàn')).not.toBeInTheDocument()
    fireEvent.click(detailButton)
    expect(await screen.findByRole('dialog', { name: 'Tài liệu đã xuất bản' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Thao tác kiểm duyệt')).not.toBeInTheDocument()
  })

  it('creates a subject with its selected faculty', async () => {
    api.getCatalog.mockImplementation((type) =>
      pageResponse(
        type === 'faculties'
          ? [{ id: 'f1', name: 'Công nghệ thông tin', majors: [] }]
          : type === 'majors'
            ? [
                {
                  id: 'm2',
                  name: 'Kỹ thuật phần mềm',
                  facultyName: 'Khoa CNTT',
                },
              ]
            : [],
      ),
    )
    api.saveCatalog.mockResolvedValue({})
    open('/admin/subjects')
    fireEvent.click(
      await screen.findByRole('button', { name: '＋ Thêm môn học' }),
    )
    fireEvent.change(screen.getByLabelText('Mã môn học'), {
      target: { value: 'IT101' },
    })
    fireEvent.change(screen.getByLabelText('Tên môn học'), {
      target: { value: 'Lập trình' },
    })
    await screen.findByRole('option', { name: 'Công nghệ thông tin' })
    fireEvent.change(screen.getByLabelText('Khoa', { exact: true }), {
      target: { value: 'f1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(api.saveCatalog).toHaveBeenCalledWith(
        'subjects',
        expect.objectContaining({ code: 'IT101', facultyId: 'f1', credits: 3 }),
      ),
    )
    expect(await screen.findByText('Đã lưu môn học.')).toBeInTheDocument()
  })

  it('updates account status and preserves its roles', async () => {
    api.getRoles.mockResolvedValue({ result: ['ADMIN', 'USER'] })
    api.getUsers.mockResolvedValue({
      result: {
        content: [
          {
            id: 'u1',
            fullName: 'Nguyễn An',
            email: 'an@example.com',
            roles: ['USER'],
            status: 'ACTIVE',
            createdAt: '2026-01-01',
          },
        ],
        totalElements: 1,
      },
    })
    api.updateUser.mockResolvedValue({})
    open('/admin/users')
    fireEvent.click(
      await screen.findByRole('button', { name: 'Xem / chỉnh sửa' }),
    )
    fireEvent.change(screen.getByLabelText('Trạng thái', { exact: true }), {
      target: { value: 'BANNED' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(api.updateUser).toHaveBeenCalledWith('u1', {
        roles: ['USER'],
        status: 'BANNED',
      }),
    )
  })

  it('shows delete conflicts and keeps the confirmation open', async () => {
    api.getCatalog.mockResolvedValue(
      pageResponse([
        { id: 'f1', code: 'IT', name: 'Công nghệ thông tin', majors: [] },
      ]),
    )
    api.deleteCatalog.mockRejectedValue(new Error('Khoa còn môn học.'))
    open('/admin/faculties')
    fireEvent.click(
      await screen.findByRole('button', { name: 'Xoá', exact: true }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xoá' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Khoa còn môn học.',
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
