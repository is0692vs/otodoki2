/**
 * Authentication Context for React Native app
 * Adapted from frontend/src/contexts/AuthContext.tsx
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api-client';
import { UserProfile, LoginRequest, RegisterRequest } from '../types/api';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_PROFILE_KEY = 'user_profile';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  // Load stored authentication state
  const loadStoredAuth = useCallback(async () => {
    try {
      const [accessToken, userProfileJson] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(USER_PROFILE_KEY),
      ]);

      if (accessToken && userProfileJson) {
        const userProfile = JSON.parse(userProfileJson);
        api.auth.setToken(accessToken);
        setState({
          isAuthenticated: true,
          user: userProfile,
          loading: false,
        });
      } else {
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    } catch (error) {
      console.warn('Failed to load stored auth:', error);
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  }, []);

  // Refresh access token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        return false;
      }

      const response = await api.auth.refresh({ refresh_token: storedRefreshToken });
      
      if (response.error || !response.data) {
        await clearTokens();
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
        return false;
      }

      const { access_token, refresh_token, user } = response.data;
      
      await Promise.all([
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, access_token),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh_token),
        AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user)),
      ]);

      api.auth.setToken(access_token);
      setState({
        isAuthenticated: true,
        user,
        loading: false,
      });
      
      return true;
    } catch (error) {
      console.warn('Failed to refresh token:', error);
      return false;
    }
  }, []);

  // Clear stored tokens
  const clearTokens = async () => {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_PROFILE_KEY),
    ]);
    api.auth.setToken(null);
  };

  // Login function
  const login = useCallback(
    async (credentials: LoginRequest): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await api.auth.login(credentials);
        
        if (response.error) {
          return {
            success: false,
            error: response.error.detail || response.error.error || 'Login failed',
          };
        }

        if (!response.data) {
          return {
            success: false,
            error: 'Invalid response from server',
          };
        }

        const { access_token, refresh_token, user } = response.data;
        
        await Promise.all([
          AsyncStorage.setItem(ACCESS_TOKEN_KEY, access_token),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh_token),
          AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user)),
        ]);

        api.auth.setToken(access_token);
        setState({
          isAuthenticated: true,
          user,
          loading: false,
        });

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Login failed',
        };
      }
    },
    []
  );

  // Register function
  const register = useCallback(
    async (credentials: RegisterRequest): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await api.auth.register(credentials);
        
        if (response.error) {
          return {
            success: false,
            error: response.error.detail || response.error.error || 'Registration failed',
          };
        }

        if (!response.data) {
          return {
            success: false,
            error: 'Invalid response from server',
          };
        }

        const { access_token, refresh_token, user } = response.data;
        
        await Promise.all([
          AsyncStorage.setItem(ACCESS_TOKEN_KEY, access_token),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh_token),
          AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user)),
        ]);

        api.auth.setToken(access_token);
        setState({
          isAuthenticated: true,
          user,
          loading: false,
        });

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed',
        };
      }
    },
    []
  );

  // Logout function
  const logout = useCallback(async () => {
    await clearTokens();
    setState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  // Set up automatic token refresh
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(async () => {
        await refreshToken();
      }, 25 * 60 * 1000); // Refresh every 25 minutes

      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated, refreshToken]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}