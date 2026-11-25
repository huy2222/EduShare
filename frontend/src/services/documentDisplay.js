const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })
const date = new Intl.DateTimeFormat('vi-VN')

export const formatDocumentNumber = (value) => number.format(value)
export const formatDocumentDate = (value) => date.format(new Date(value))

export const documentTypes = {
  LECTURE_NOTE: 'Slide bài giảng', EXAM: 'Đề thi', PROJECT: 'Bài tập lớn', TEXTBOOK: 'Giáo trình',
  ASSIGNMENT: 'Bài tập', SOLUTION: 'Lời giải', SUMMARY: 'Tóm tắt', REFERENCE: 'Tài liệu tham khảo', OTHER: 'Khác',
}

export function formatDocumentSize(bytes) {
  if (bytes >= 1024 ** 2) return `${number.format(bytes / 1024 ** 2)} MB`
  if (bytes >= 1024) return `${number.format(bytes / 1024)} KB`
  return `${number.format(bytes)} B`
}
