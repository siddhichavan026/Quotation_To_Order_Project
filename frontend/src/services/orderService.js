// src/services/orderService.js
// Wraps the /api/orders endpoints.
// getById will be added here when we build the "Order Details" screen.

import api from './api';

// Same reasoning as quotations/requests: returns the customer's own
// orders for a CUSTOMER token, or ALL orders for an ADMIN token.
export async function getMyOrders() {
  const response = await api.get('/orders');
  return response.data.orders;
}
export const getOrders = getMyOrders; // Admin-facing alias

export async function getOrderById(id) {
  const response = await api.get(`/orders/${id}`);
  return response.data.order; // includes items[] and payment{}
}

// --- Admin-only operations below ---

// payment_method: "CASH_ON_DELIVERY" | "UPI" | "BANK_TRANSFER"
export async function convertToOrder(quotation_id, payment_method) {
  const response = await api.post('/orders/convert', { quotation_id, payment_method });
  return response.data; // { message, order_id }
}

// status: "PROCESSING" | "COMPLETED" | "CANCELLED"
export async function updateOrderStatus(id, status) {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data; // { message }
}