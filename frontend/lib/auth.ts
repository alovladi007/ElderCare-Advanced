/**
 * Authentication utilities for Next.js frontend
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'CLINICIAN' | 'CAREGIVER' | 'FAMILY' | 'ELDER';
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:31611';

const AUTH_STORAGE_KEYS = {
  TOKEN: 'eldercare_token',
  USER: 'eldercare_user',
};

/**
 * Get stored auth token
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
};

/**
 * Get stored user data
 */
export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Store auth data
 */
export const storeAuthData = (token: string, user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * Clear auth data
 */
export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
};

/**
 * Login
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data: AuthResponse = await response.json();
  storeAuthData(data.access_token, data.user);
  return data;
};

/**
 * Logout
 */
export const logout = (): void => {
  clearAuthData();
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
};

/**
 * Check if authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
