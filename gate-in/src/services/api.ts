import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface VehicleEntry {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  ticketId?: string;
  driverName?: string;
  phoneNumber?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const parkingApi = {
  recordEntry: async (entry: VehicleEntry): Promise<ApiResponse<VehicleEntry>> => {
    try {
      const response = await api.post<ApiResponse<VehicleEntry>>('/entries', entry);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.message || 'Failed to record vehicle entry',
        };
      }
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  },
}; 