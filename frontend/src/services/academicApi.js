import { apiGet } from './apiClient'

export function getAcademicCatalog() {
  return apiGet('/academic/faculties')
}
