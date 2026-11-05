import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import AdminAccess from './AdminAccess'
import * as api from '../services/accessApi'

vi.mock('../services/accessApi', () => ({
  listManagedRoles: vi.fn(),
  listManagedPermissions: vi.fn(),
  getManagedRole: vi.fn(),
  saveManagedRole: vi.fn(),
  configureManagedRole: vi.fn(),
  deleteManagedRole: vi.fn(),
}))
const permissions = [
  {
    code: 'USER_VIEW',
    name: 'Xem người dùng',
    group: 'Người dùng',
    description: 'Xem danh sách',
  },
  {
    code: 'USER_BAN',
    name: 'Khoá tài khoản',
    group: 'Người dùng',
    description: 'Khoá / mở',
  },
  {
    code: 'CATALOG_VIEW',
    name: 'Xem danh mục',
    group: 'Danh mục',
    description: 'Xem khoa',
  },
]
const role = {
  id: 'r1',
  code: 'ASSISTANT',
  displayName: 'Trợ giảng',
  description: 'Hỗ trợ',
  active: true,
  userCount: 12,
  permissionCount: 1,
}
beforeEach(() => {
  vi.resetAllMocks()
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
  api.listManagedRoles.mockResolvedValue({
    result: { items: [role], totalElements: 1 },
  })
  api.listManagedPermissions.mockResolvedValue({ result: permissions })
  api.getManagedRole.mockResolvedValue({
    result: { ...role, permissions: ['CATALOG_VIEW'] },
  })
})

it('creates a role with an immutable code and activation state', async () => {
  api.saveManagedRole.mockResolvedValue({})
  render(<AdminAccess renderUsers={() => null} />)
  fireEvent.click(screen.getByRole('button', { name: '＋ Tạo vai trò' }))
  fireEvent.change(screen.getByLabelText('Tên vai trò'), {
    target: { value: 'Trợ giảng mới' },
  })
  fireEvent.change(screen.getByLabelText(/Mã vai trò/), {
    target: { value: 'assistant_new' },
  })
  fireEvent.click(screen.getByLabelText('Kích hoạt vai trò'))
  fireEvent.click(screen.getByRole('button', { name: 'Lưu vai trò' }))
  await waitFor(() =>
    expect(api.saveManagedRole).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'ASSISTANT_NEW',
        displayName: 'Trợ giảng mới',
        active: false,
      }),
    ),
  )
  expect(await screen.findByText('Đã lưu vai trò.')).toBeInTheDocument()
})

it('saves one atomic permission set and preserves permissions outside the current filter', async () => {
  api.configureManagedRole.mockImplementation((id, selected) =>
    Promise.resolve({ result: { ...role, permissions: selected } }),
  )
  render(<AdminAccess renderUsers={() => null} />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Điều chỉnh quyền' }),
  )
  fireEvent.change(await screen.findByLabelText('Nhóm quyền'), {
    target: { value: 'Người dùng' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Chọn quyền đang hiển thị' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() =>
    expect(api.configureManagedRole).toHaveBeenCalledWith(
      'r1',
      expect.arrayContaining(['CATALOG_VIEW', 'USER_VIEW', 'USER_BAN']),
    ),
  )
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Đã cập nhật quyền',
  )
})

it('protects ADMIN controls and displays backend delete conflicts', async () => {
  api.listManagedRoles.mockResolvedValue({
    result: {
      items: [{ ...role, code: 'ADMIN', displayName: 'Quản trị viên' }],
      totalElements: 1,
    },
  })
  api.getManagedRole.mockResolvedValue({
    result: {
      ...role,
      code: 'ADMIN',
      displayName: 'Quản trị viên',
      permissions: permissions.map((p) => p.code),
    },
  })
  render(<AdminAccess renderUsers={() => null} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Xem quyền' }))
  expect(
    (await screen.findAllByRole('checkbox')).every((input) => input.disabled),
  ).toBe(true)
  expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled()
})

it('keeps delete confirmation open when the role is assigned', async () => {
  api.deleteManagedRole.mockRejectedValue(
    new Error('Vai trò đang được gán cho người dùng.'),
  )
  render(<AdminAccess renderUsers={() => null} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Xoá' }))
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xoá' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('đang được gán')
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

it('opens the user assignment tab using the existing paginated users screen', async () => {
  render(
    <AdminAccess renderUsers={() => <p>Danh sách phân quyền người dùng</p>} />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Phân quyền người dùng' }))
  expect(
    screen.getByText('Danh sách phân quyền người dùng'),
  ).toBeInTheDocument()
})

it('shows unavailable system permissions but never includes them in select-all or save', async () => {
  api.listManagedPermissions.mockResolvedValue({
    result: [
      ...permissions,
      {
        code: 'REPORT_VIEW',
        name: 'Xem báo cáo',
        group: 'Báo cáo',
        description: 'Chưa có chức năng',
        available: false,
      },
    ],
  })
  api.configureManagedRole.mockImplementation((id, selected) =>
    Promise.resolve({ result: { ...role, permissions: selected } }),
  )
  render(<AdminAccess renderUsers={() => null} />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Điều chỉnh quyền' }),
  )
  expect(
    await screen.findByRole('checkbox', { name: /Xem báo cáo/ }),
  ).toBeDisabled()
  fireEvent.click(
    screen.getByRole('button', { name: 'Chọn quyền đang hiển thị' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() =>
    expect(api.configureManagedRole).toHaveBeenCalledWith(
      'r1',
      expect.not.arrayContaining(['REPORT_VIEW']),
    ),
  )
})

it('restricts role creation and configuration for a read-only role viewer', async () => {
  render(
    <AdminAccess
      currentUser={{ roles: [], permissions: ['ACCESS_ROLE_VIEW'] }}
      renderUsers={() => null}
    />,
  )
  expect(screen.getByRole('button', { name: '＋ Tạo vai trò' })).toBeDisabled()
  fireEvent.click(await screen.findByRole('button', { name: 'Xem quyền' }))
  expect(
    (await screen.findAllByRole('checkbox')).every((input) => input.disabled),
  ).toBe(true)
})
