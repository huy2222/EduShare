export const catalogPermissions = (prefix) =>
  ['VIEW', 'CREATE', 'UPDATE', 'DELETE'].map((op) => prefix + '_' + op)
export const sectionPermissions = {
  overview: ['OVERVIEW_VIEW'],
  // DOCUMENT_VIEW is intentionally excluded: normal users need it for their
  // own document workspace, but it must not grant access to moderation.
  documents: ['DOCUMENT_APPROVE', 'DOCUMENT_REJECT', 'APPROVE_DOCUMENT', 'DOCUMENT_HIDE'],
  moderation: ['DOCUMENT_APPROVE', 'DOCUMENT_REJECT', 'APPROVE_DOCUMENT', 'DOCUMENT_HIDE'],
  users: ['USER_VIEW'],
  faculties: [
    'CATALOG_VIEW',
    'CATALOG_MANAGE',
    ...catalogPermissions('FACULTY'),
    ...catalogPermissions('MAJOR'),
  ],
  subjects: [
    'CATALOG_VIEW',
    'CATALOG_MANAGE',
    ...catalogPermissions('SUBJECT'),
  ],
  access: [
    'ACCESS_ROLE_VIEW',
    'ACCESS_ROLE_CREATE',
    'ACCESS_ROLE_UPDATE',
    'ACCESS_ROLE_DELETE',
    'PERMISSION_MANAGE',
  ],
}
export const hasPermission = (user, ...codes) =>
  user?.roles?.includes('ADMIN') ||
  codes.some((code) => user?.permissions?.includes(code))
export const canEnterAdmin = (user) =>
  Object.values(sectionPermissions).some((codes) =>
    hasPermission(user, ...codes),
  )
