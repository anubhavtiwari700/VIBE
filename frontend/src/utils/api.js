import axios from 'axios';
import { API_URL } from './constants';

console.log('VIBE System: Connecting to Core at', API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 60000, // 60 seconds to handle Render free tier cold starts & email processing
});

// Add a request interceptor for tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const systemLock = localStorage.getItem('vibe_system_lock');
  
  if (token) {
    if (config.headers && config.headers.set) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  if (systemLock) {
    if (config.headers && config.headers.set) {
      config.headers.set('X-Vibe-System-Lock', systemLock);
    } else {
      config.headers['X-Vibe-System-Lock'] = systemLock;
    }
  }
  
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/profile')) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    // Force logout immediately if account is blocked
    if (error.response?.status === 403 && error.response?.data?.message === 'ACCOUNT_BLOCKED') {
      localStorage.removeItem('token');
      localStorage.removeItem('vibe_system_lock');
      alert('⛔ Your account has been suspended by an administrator.');
      window.location.href = '/';
    }
    console.error('Core Connectivity Error:', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out. The backend might be starting up (Cold Start). Please wait 30 seconds and try again.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
