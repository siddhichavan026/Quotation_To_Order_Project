// src/services/api.js
// Central place where every API call in the app goes through.
// - Automatically attaches the JWT token to every request.
// - Automatically logs the user out if the backend says the token
//   is invalid or expired (401 response).

import axios from 'axios';
import { getToken, clearAuth } from '../utils/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

// Attach the JWT token to every outgoing request, if we have one
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend rejects our token (401) on a protected request, the session
// has expired or is invalid: clear local auth data and go back to /login.
// Requests to /auth/* (login, register) are excluded - a 401 there just means
// "wrong email or password", and the Login page must stay put to show that message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.startsWith('/auth/');

    if (error.response && error.response.status === 401 && !isAuthRequest) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;