// src/services/authService.js
// Wraps the two auth endpoints from the backend (Step 1).
// Controllers/business-screen services (products, quotations, etc.)
// will follow this exact same pattern in later steps.

import api from './api';

export async function loginRequest(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data; // { message, token, user }
}

// Public registration always creates a CUSTOMER account - the server decides
// the role, so none is sent from here.
export async function registerRequest(name, email, password) {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data; // { message, user }
}