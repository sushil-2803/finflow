import { api } from './client';
export const getBudgets = () => api.get('/budgets').then((r) => r.data.data || []);
export const getBudget = (id) => api.get(`/budgets/${id}`).then((r) => r.data.data);
export const createBudget = (data) => api.post('/budgets', data).then((r) => r.data.data);
export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data).then((r) => r.data.data);
export const closeBudget = (id) => api.post(`/budgets/${id}/close`).then((r) => r.data.data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);
