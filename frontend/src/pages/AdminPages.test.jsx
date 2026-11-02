import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  saveCatalog: vi.fn(),
  deleteCatalog: vi.fn(),
}))

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
      Promise.resolve({
        result:
          type === 'faculties'
            ? [
                {
                  id: 'f1',
                  code: 'IT',
                  name: 'Công nghệ thông tin',
                  majors: [],
                },
              ]
            : [],
      }),
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
      Promise.resolve({
        result:
          type === 'faculties'
            ? [
                { id: 'f1', name: 'Khoa Toán', majors: [] },
                {
                  id: 'f2',
                  name: 'Khoa CNTT',
                  majors: [{ id: 'm2', name: 'Kỹ thuật phần mềm' }],
                },
              ]
            : [],
      }),
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
    fireEvent.change(screen.getByLabelText('Khoa', { exact: true }), {
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

  it('creates a subject with its selected faculty', async () => {
    api.getCatalog.mockImplementation((type) =>
      Promise.resolve({
        result:
          type === 'faculties'
            ? [{ id: 'f1', name: 'Công nghệ thông tin', majors: [] }]
            : [],
      }),
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
    api.getCatalog.mockResolvedValue({
      result: [
        { id: 'f1', code: 'IT', name: 'Công nghệ thông tin', majors: [] },
      ],
    })
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
