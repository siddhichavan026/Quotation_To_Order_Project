import api from './api';


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