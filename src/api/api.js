import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getFolders = () => api.get('/folders');
export const createFolder = (data) => api.post('/folders', data);
export const deleteFolder = (id) => api.delete(`/folders/${id}`);

// Provide Snippet API functions
export const getSnippets = () => api.get('/snippets');
export const getSnippet = (id) => api.get(`/snippets/${id}`);
export const createSnippet = (data) => api.post('/snippets', data);
export const updateSnippet = (id, data) => api.put(`/snippets/${id}`, data);
export const deleteSnippet = (id) => api.delete(`/snippets/${id}`);

// Canvas API
export const getCanvases = (userId) => api.get(`/canvas/list/${userId}`);
export const getCanvas = (id) => api.get(`/canvas/${id}`);
export const saveCanvas = (data) => api.post('/canvas/save', data);
export const deleteCanvas = (id) => api.delete(`/canvas/${id}`);

export default api;
