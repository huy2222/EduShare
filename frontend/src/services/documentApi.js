import { apiGet, apiPostForm } from './apiClient'

export function getAcademicCatalog() {
  return apiGet('/academic/faculties')
}

export function uploadDocument(metadata, file) {
  const formData = new FormData()
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  )
  formData.append('file', file)
  return apiPostForm('/documents/upload', formData)
}
