import api from './api';

export async function getMyOrders() {
  const response = await api.get('/orders');
  return response.data.orders;
}
export const getOrders = getMyOrders; 

export async function getOrderById(id) {
  const response = await api.get(`/orders/${id}`);
  return response.data.order; 
}

export async function convertToOrder(quotation_id, payment_method) {
  const response = await api.post('/orders/convert', { quotation_id, payment_method });
  return response.data; 
}


export async function updateOrderStatus(id, status) {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data; // { message }
}