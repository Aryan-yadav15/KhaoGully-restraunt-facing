import { api } from './api';
import { SignupFormData, LoginFormData, AuthResponse } from '../types/user.types';

export const authService = {
  // Restaurant Owner Signup
  signup: async (data: SignupFormData): Promise<{ message: string; user_id: string }> => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  // Restaurant Owner Login
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user_data));
      localStorage.setItem('loginTime', Date.now().toString());
    }
    return response.data;
  },

  // Admin Login
  adminLogin: async (data: LoginFormData): Promise<AuthResponse> => {
    const response = await api.post('/admin/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.user_data));
      localStorage.setItem('loginTime', Date.now().toString());
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    localStorage.removeItem('loginTime');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get current admin from localStorage
  getCurrentAdmin: () => {
    const adminStr = localStorage.getItem('admin');
    return adminStr ? JSON.parse(adminStr) : null;
  },

  // Check if authenticated and session is valid (3 hours)
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const loginTime = localStorage.getItem('loginTime');
    
    if (!token || !loginTime) {
      return false;
    }

    // Check if session has expired (3 hours = 10800000 milliseconds)
    const sessionDuration = 3 * 60 * 60 * 1000; // 3 hours
    const currentTime = Date.now();
    const timeElapsed = currentTime - parseInt(loginTime);

    if (timeElapsed > sessionDuration) {
      // Session expired, clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('loginTime');
      return false;
    }

    return true;
  },
};
