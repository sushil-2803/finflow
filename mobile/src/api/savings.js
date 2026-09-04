import { api } from './client';
export const getSavings = () => api.get('/savings').then((r) => r.data.overallSavings || 0);
export const getSavingsHistory = () => api.get('/savings/history').then((r) => r.data.data || []);
export const depositSavings = (data) => api.post('/savings/deposit', data).then((r) => r.data);
export const spendSavings = (data) => api.post('/savings/spend', data).then((r) => r.data);
