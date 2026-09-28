// src/services/quotationService.js
// Wraps the /api/quotations endpoints.
// More functions (getById, respond/accept-reject) will be added here
// when we build the "My Quotations" and "Quotation Details" screens.

import api from './api';

// Same reasoning as quotation requests: this endpoint returns the
// customer's own quotations for a CUSTOMER token, or ALL quotations
// for an ADMIN token.
export async function getMyQuotations() {
  const response = await api.get('/quotations');
  return response.data.quotations;
}
export const getQuotations = getMyQuotations; // Admin-facing alias

export async function getQuotationById(id) {
  const response = await api.get(`/quotations/${id}`);
  return response.data.quotation;
}

// decision: "ACCEPT" | "REJECT" (Customer only)
export async function respondToQuotation(id, decision) {
  const response = await api.patch(`/quotations/${id}/respond`, { decision });
  return response.data;
}

// --- Admin-only operation below ---

// valid_until format: "YYYY-MM-DD"
export async function createQuotation(request_id, valid_until) {
  const response = await api.post('/quotations', { request_id, valid_until });
  return response.data; // { message, quotation_id, total_amount }
}