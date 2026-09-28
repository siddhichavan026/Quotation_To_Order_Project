// src/services/quotationRequestService.js
// Wraps the /api/quotation-requests endpoints.
// More functions (create, getById) will be added here when we build
// the "Create Quotation Request" and "My Quotation Requests" screens.

import api from './api';

// GET /api/quotation-requests returns the customer's own requests for a
// CUSTOMER token, or ALL requests for an ADMIN token (decided by the
// backend based on the JWT role) - so the same call works for both
// "My Quotation Requests" (Customer) and "Quotation Request Management" (Admin).
export async function getMyQuotationRequests() {
  const response = await api.get('/quotation-requests');
  return response.data.requests;
}
export const getQuotationRequests = getMyQuotationRequests; // Admin-facing alias

// items: [{ product_id, requested_quantity }, ...]
export async function createQuotationRequest(items) {
  const response = await api.post('/quotation-requests', { items });
  return response.data; // { message, request_id }
}

export async function getQuotationRequestById(id) {
  const response = await api.get(`/quotation-requests/${id}`);
  return response.data.request;
}