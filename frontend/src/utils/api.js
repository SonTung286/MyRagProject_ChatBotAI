import axios from 'axios';

// 1. Cấu hình đường dẫn gốc (Base URL)
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: baseURL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Tự động gắn Token vào mọi Request (nếu có)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, (error) => Promise.reject(error));

// 3. Tự động xử lý lỗi Token hết hạn (Optional)
API.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    // Nếu token hết hạn -> Tự động đăng xuất
    localStorage.clear();
    window.location.href = '/'; 
  }
  return Promise.reject(error);
});

export default API;