import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditProfilePage, ProfilePage } from './ProfilePages'
import { getAcademicCatalog } from '../services/academicApi'
import { getMyProfile, updateMyProfile } from '../services/profileApi'

vi.mock('../services/academicApi', () => ({ getAcademicCatalog: vi.fn() }))
vi.mock('../services/profileApi', () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}))

const profile = {
  id: 'profile-1',
  fullName: 'Nguyễn Văn A',
  email: 'student@example.com',
  phone: '0912345678',
  bio: 'Yêu thích chia sẻ tài liệu học tập.',
  facultyId: 'faculty-1',
  facultyName: 'Công nghệ Thông tin',
  majorId: 'major-1',
  majorName: 'Kỹ thuật Phần mềm',
  githubUrl: 'https://github.com/student',
  linkedinUrl: 'https://linkedin.com/in/student',
  createdAt: '2024-09-01T08:00:00',
}

const catalog = [{
  id: 'faculty-1',
  name: 'Công nghệ Thông tin',
  majors: [
    { id: 'major-1', name: 'Kỹ thuật Phần mềm' },
    { id: 'major-2', name: 'Khoa học Máy tính' },
  ],
}]

function renderProfileRoute(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/profile" element={<ProfilePage authenticated />} />
        <Route path="/profile/edit" element={<EditProfilePage authenticated />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('personal profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMyProfile.mockResolvedValue({ result: profile })
    getAcademicCatalog.mockResolvedValue({ result: catalog })
    updateMyProfile.mockResolvedValue({ result: profile })
  })

  it('loads profile information from the backend', async () => {
    renderProfileRoute('/profile')

    expect(await screen.findByRole('heading', { name: 'Nguyễn Văn A' })).toBeInTheDocument()
    expect(screen.getByText('Công nghệ Thông tin')).toBeInTheDocument()
    expect(screen.getByText('Kỹ thuật Phần mềm')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', profile.githubUrl)
  })

  it('loads the edit form and saves all editable fields', async () => {
    renderProfileRoute('/profile/edit')

    const fullName = await screen.findByLabelText('Họ và tên hiển thị')
    fireEvent.change(fullName, { target: { value: 'Nguyễn Văn B' } })
    fireEvent.change(screen.getByLabelText('Chuyên ngành đào tạo'), { target: { value: 'major-2' } })
    fireEvent.change(screen.getByLabelText('Liên kết GitHub'), { target: { value: 'https://github.com/new' } })
    fireEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/ }))

    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'Nguyễn Văn B',
      facultyId: 'faculty-1',
      majorId: 'major-2',
      githubUrl: 'https://github.com/new',
    })))
    expect(await screen.findByText('Thông tin cá nhân đã được cập nhật.')).toBeInTheDocument()
  })

  it('returns to the profile without submitting when cancelled', async () => {
    renderProfileRoute('/profile/edit')

    await screen.findByDisplayValue('Nguyễn Văn A')
    fireEvent.click(screen.getByRole('button', { name: 'Hủy bỏ' }))

    expect(await screen.findByRole('heading', { name: 'Nguyễn Văn A' })).toBeInTheDocument()
    expect(updateMyProfile).not.toHaveBeenCalled()
  })
})
