// src/utils/roles.js
// Simple constants so we never hardcode raw strings like "ADMIN" all
// over the codebase - and so a typo becomes a build/reference error
// instead of a silent bug.

export const ROLES = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER'
};