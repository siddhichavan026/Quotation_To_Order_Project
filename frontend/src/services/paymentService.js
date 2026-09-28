// src/services/paymentService.js
// Wraps /api/payments. getPayments/getPaymentByOrder are readable by
// both roles (backend scopes results), but confirmPayment is Admin-only.

import api from './api';

export async function getPayments() {
  const response = await api.get('/payments');
  return response.data.payments;
}

export async function getPaymentByOrder(orderId) {
  const response = await api.get(`/payments/${orderId}`);
  return response.data.payment;
}

// Admin-only: marks the payment for this order as FULLY_PAID
export async function confirmPayment(orderId) {
  const response = await api.patch(`/payments/${orderId}/confirm`);
  return response.data; // { message }
}