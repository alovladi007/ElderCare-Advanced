import Cookies from 'js-cookie';
import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ELDER' | 'FAMILY' | 'CAREGIVER' | 'CLINICIAN' | 'ADMIN';
  phone?: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
}

export const login = async (credentials: LoginCredentials): Promise<User> => {
  const response = await api.post('/auth/login', credentials);
  const { accessToken, refreshToken, user } = response.data;

  // Store tokens in cookies
  Cookies.set('accessToken', accessToken, { expires: 1 / 96 }); // 15 minutes
  Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7 days

  return user;
};

export const register = async (data: RegisterData): Promise<User> => {
  const response = await api.post('/auth/register', data);
  const { accessToken, refreshToken, user } = response.data;

  // Store tokens in cookies
  Cookies.set('accessToken', accessToken, { expires: 1 / 96 });
  Cookies.set('refreshToken', refreshToken, { expires: 7 });

  return user;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear tokens regardless of API response
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = Cookies.get('accessToken');
    if (!token) return null;

    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!Cookies.get('accessToken');
};
