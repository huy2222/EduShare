import { apiDelete, apiGet, apiGetBlob, apiPostJson, apiPutJson } from './apiClient'

const publicRead = { credentials: 'omit' }
const documentPath = (id) => `/library/documents/${encodeURIComponent(id)}`
const interactionPath = (id) => `/library/me/documents/${encodeURIComponent(id)}`

export function getPublishedDocuments(query, page) {
  return apiGet(`/library/documents?${new URLSearchParams({ query, page })}`, publicRead)
}

export function getPublishedDocument(id) {
  return apiGet(documentPath(id), publicRead)
}

export function getDocumentComments(id, page, { authenticated = false, parentId } = {}) {
  const path = authenticated ? interactionPath(id) : documentPath(id)
  const query = new URLSearchParams({ page })
  if (parentId) query.set('parentId', parentId)
  return apiGet(`${path}/comments?${query}`, authenticated ? undefined : publicRead)
}

export function getDocumentPreview(id) {
  return apiGetBlob(`${documentPath(id)}/preview`, publicRead)
}

export async function downloadPublishedDocument(id, fileName) {
  const blob = await apiGetBlob(`${documentPath(id)}/download`, publicRead)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function getDocumentViewer(id) {
  return apiGet(interactionPath(id))
}

export function postDocumentComment(id, body, parentId) {
  return apiPostJson(`${interactionPath(id)}/comments`, { body, parentId })
}

export function setDocumentCommentLike(id, commentId, liked) {
  const path = `${interactionPath(id)}/comments/${encodeURIComponent(commentId)}/like`
  return liked ? apiPutJson(path, {}) : apiDelete(path)
}

export function rateDocument(id, stars) {
  return apiPutJson(`${interactionPath(id)}/rating`, { stars })
}

export function setDocumentFavorite(id, favorite) {
  const path = `${interactionPath(id)}/favorite`
  return favorite ? apiPutJson(path, {}) : apiDelete(path)
}

export function getFavoriteDocuments(query, page) {
  return apiGet(`/library/me/favorites?${new URLSearchParams({ query, page })}`)
}
