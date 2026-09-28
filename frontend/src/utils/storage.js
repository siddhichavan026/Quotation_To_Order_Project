// src/utils/storage.js
// Small wrapper around localStorage so the rest of the app never
// touches localStorage keys directly - only these functions do.

const TOKEN_KEY = 'qto_token';
const USER_KEY = 'qto_user';

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}