import { apiPostForm } from './apiClient'
export { getAcademicCatalog } from './academicApi'

export function uploadDocument(metadata, file) {
  const formData = new FormData()
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  )
  formData.append('file', file)
  return apiPostForm('/documents/upload', formData)
}
