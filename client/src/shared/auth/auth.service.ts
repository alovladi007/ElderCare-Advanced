/**
 * Unified Authentication Service
 * Works across React and Next.js frontends
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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:9401/api';

/**
 * Storage keys for auth data
 */
export const AUTH_STORAGE_KEYS = {
  TOKEN: 'eldercare_token',
  USER: 'eldercare_user',
  REFRESH_TOKEN: 'eldercare_refresh_token',
} as const;

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
 * Clear auth data (logout)
 */
export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
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
 * Register new user
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  const result: AuthResponse = await response.json();
  storeAuthData(result.access_token, result.user);
  return result;
};

/**
 * Logout user
 */
export const logout = (): void => {
  clearAuthData();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<User> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
};

/**
 * Change password
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request password reset');
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset password');
  }
};

/**
 * Check if user has required role
 */
export const hasRole = (requiredRoles: string[]): boolean => {
  const user = getStoredUser();
  if (!user) return false;
  return requiredRoles.includes(user.role);
};
