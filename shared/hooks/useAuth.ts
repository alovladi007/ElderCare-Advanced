/**
 * Unified Auth Hook for React and Next.js
 */

import { useState, useEffect, useCallback } from 'react';
import {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  login as loginService,
  register as registerService,
  logout as logoutService,
  getStoredUser,
  isAuthenticated as checkAuth,
  getProfile,
  changePassword as changePasswordService,
} from '../auth/auth.service';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (checkAuth()) {
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            // Optionally refresh profile from server
            try {
              const freshProfile = await getProfile();
              setUser(freshProfile);
            } catch (err) {
              // If profile fetch fails, use stored user
              console.error('Failed to refresh profile:', err);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await loginService(credentials);
      setUser(response.user);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await registerService(data);
      setUser(response.user);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    logoutService();
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const freshProfile = await getProfile();
      setUser(freshProfile);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh profile');
      throw err;
    }
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        setIsLoading(true);
        setError(null);
        await changePasswordService(currentPassword, newPassword);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to change password';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshProfile,
    changePassword,
    clearError,
  };
};

/**
 * Hook to check if user has required role
 */
export const useRole = (requiredRoles: string[]): boolean => {
  const { user } = useAuth();
  if (!user) return false;
  return requiredRoles.includes(user.role);
};

/**
 * Hook for protected routes
 */
export const useRequireAuth = (redirectUrl: string = '/login') => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    }
  }, [isAuthenticated, isLoading, redirectUrl]);

  return { isAuthenticated, isLoading };
};
