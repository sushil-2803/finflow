import { api } from './client';
export const getGroups = () => api.get('/groups').then((r) => r.data.data || []);
export const getGroup = (id) => api.get(`/groups/${id}`).then((r) => r.data.data);
export const createGroup = (data) => api.post('/groups', data).then((r) => r.data.data);
export const updateGroup = (id, data) => api.put(`/groups/${id}`, data).then((r) => r.data.data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`);
