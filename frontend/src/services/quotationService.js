import api from './api';


export async function getMyQuotations() {
  const response = await api.get('/quotations');
  return response.data.quotations;
}
export const getQuotations = getMyQuotations; 

export async function getQuotationById(id) {
  const response = await api.get(`/quotations/${id}`);
  return response.data.quotation;
}


export async function respondToQuotation(id, decision) {
  const response = await api.patch(`/quotations/${id}/respond`, { decision });
  return response.data;
}



export async function createQuotation(request_id, valid_until) {
  const response = await api.post('/quotations', { request_id, valid_until });
  return response.data; 
}