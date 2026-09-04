import { api } from './client';
export const loginWithGoogle = (credential) => api.post('/auth/google', { credential }).then((r) => r.data);
export const getCurrentUser = () => api.get('/auth/me').then((r) => r.data.user);
export const logoutRequest = (refreshToken) => api.post('/auth/logout', { refreshToken });
