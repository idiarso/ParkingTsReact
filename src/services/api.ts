import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Dashboard
export const getDashboardStatistics = async () => {
  const response = await axios.get(`${API_BASE_URL}/dashboard/statistics`);
  return response.data;
}; 