import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL + '/api',
});

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
}

const saved = localStorage.getItem('token');
if (saved) setToken(saved);

// 👉 helper for images
export function getImageUrl(path) {
  if (!path) return '/placeholder.png';
  return API_URL + path; // ensures it becomes http://localhost:4000/uploads/xxx.jpg
}
