import api from './api';

export async function getProducts() {
  const response = await api.get('/products');
  return response.data.products;
}

// --- Admin-only operations below ---

export async function createProduct(product) {
  const response = await api.post('/products', product);
  return response.data; // { message, product }
}

export async function updateProduct(id, product) {
  const response = await api.put(`/products/${id}`, product);
  return response.data; // { message }
}

export async function deleteProduct(id) {
  const response = await api.delete(`/products/${id}`);
  return response.data; // { message }
}