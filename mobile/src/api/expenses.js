import { api } from './client';
export const getExpenses = (params = {}) => api.get('/expenses', { params }).then((r) => r.data);
export const createExpense = (data) => api.post('/expenses', data).then((r) => r.data.data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data).then((r) => r.data.data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const addRefund = (id, data) => api.post(`/expenses/${id}/refunds`, data).then((r) => r.data.data);
