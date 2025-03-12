// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Default request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Configure axios defaults
import axios from 'axios';
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = REQUEST_TIMEOUT;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for authentication
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
} 