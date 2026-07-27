import { useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const authenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();

    setIsAuthenticated(authenticated);
    setUser(currentUser);
    setLoading(false);
  };

  const clearError = useCallback(() => setError(null), []);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Please check your details and try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err?.message || 'Unable to create your account. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  return {
    user,
    loading,
    // LoginPage and RegisterPage destructure these three. They were never
    // returned, so `clearError()` threw a TypeError on submit - and in
    // RegisterPage, on every keystroke.
    isLoading,
    error,
    clearError,
    isAuthenticated,
    login,
    register,
    logout,
  };
};
