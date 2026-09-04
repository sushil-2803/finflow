import { api } from './client';
export const getCategories = () => api.get('/categories').then((r) => r.data.data || []);
export const createCategory = (name) => api.post('/categories', { name }).then((r) => r.data.data);
