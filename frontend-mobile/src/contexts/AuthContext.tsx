import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services";
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  TokenBundleResponse,
  UserProfile,
} from "../types";

const AUTH_STORAGE_KEY = "otodoki2:auth:v1";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

interface StoredAuthPayload {
  user: UserProfile;
  tokens: AuthTokens;
}

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  status: AuthStatus;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: (payload: RegisterRequest) => Promise<boolean>;
  login: (payload: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function createTokens(bundle: TokenBundleResponse): AuthTokens {
  const now = Date.now();
  return {
    accessToken: bundle.access_token,
    refreshToken: bundle.refresh_token,
    accessTokenExpiresAt: now + bundle.expires_in * 1000,
    refreshTokenExpiresAt: now + bundle.refresh_expires_in * 1000,
  };
}

async function loadStoredAuth(): Promise<StoredAuthPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthPayload | null;
    if (!parsed || !parsed.tokens || !parsed.user) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn("Failed to parse stored auth state", error);
    return null;
  }
}

async function saveStoredAuth(payload: StoredAuthPayload | null): Promise<void> {
  try {
    if (!payload) {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (error) {
    console.warn("Failed to persist auth state", error);
  }
}

function isTokenExpired(timestamp: number): boolean {
  return Date.now() >= timestamp;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyBundle = useCallback(async (bundle: TokenBundleResponse) => {
    const nextTokens = createTokens(bundle);
    setUser(bundle.user);
    setTokens(nextTokens);
    await saveStoredAuth({ user: bundle.user, tokens: nextTokens });
    api.auth.setToken(nextTokens.accessToken);
    setStatus("authenticated");
  }, []);

  const clearAuthState = useCallback(async () => {
    setUser(null);
    setTokens(null);
    await saveStoredAuth(null);
    api.auth.setToken(null);
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (!tokens) {
      return false;
    }
    if (isTokenExpired(tokens.refreshTokenExpiresAt)) {
      await clearAuthState();
      return false;
    }

    const payload: RefreshTokenRequest = {
      refresh_token: tokens.refreshToken,
    };

    const response = await api.auth.refresh(payload);
    if (response.data) {
      await applyBundle(response.data);
      return true;
    }

    const message = response.error?.detail || response.error?.error;
    if (message) {
      setError(message);
    }
    await clearAuthState();
    return false;
  }, [tokens, applyBundle, clearAuthState]);

  useEffect(() => {
    const initializeAuth = async () => {
      const stored = await loadStoredAuth();
      if (!stored) {
        await clearAuthState();
        return;
      }

      if (isTokenExpired(stored.tokens.refreshTokenExpiresAt)) {
        await clearAuthState();
        return;
      }

      setUser(stored.user);
      setTokens(stored.tokens);
      api.auth.setToken(stored.tokens.accessToken);

      if (isTokenExpired(stored.tokens.accessTokenExpiresAt)) {
        const success = await refresh();
        if (!success) {
          await clearAuthState();
        }
      } else {
        setStatus("authenticated");
      }
    };

    initializeAuth();
  }, [clearAuthState, refresh]);

  const register = useCallback(
    async (payload: RegisterRequest): Promise<boolean> => {
      setLoading(true);
      setError(null);
      const response = await api.auth.register(payload);
      setLoading(false);

      if (response.data) {
        await applyBundle(response.data);
        return true;
      }

      const message = response.error?.detail || response.error?.error;
      if (message) {
        setError(message);
      }
      await clearAuthState();
      return false;
    },
    [applyBundle, clearAuthState]
  );

  const login = useCallback(
    async (payload: LoginRequest): Promise<boolean> => {
      setLoading(true);
      setError(null);
      const response = await api.auth.login(payload);
      setLoading(false);

      if (response.data) {
        await applyBundle(response.data);
        return true;
      }

      const message = response.error?.detail || response.error?.error;
      if (message) {
        setError(message);
      }
      await clearAuthState();
      return false;
    },
    [applyBundle, clearAuthState]
  );

  const logout = useCallback(async () => {
    await clearAuthState();
  }, [clearAuthState]);

  const clearError = useCallback(() => setError(null), []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      tokens,
      status,
      loading,
      error,
      isAuthenticated: status === "authenticated" && !!user,
      register,
      login,
      logout,
      refresh,
      clearError,
    }),
    [
      user,
      tokens,
      status,
      loading,
      error,
      register,
      login,
      logout,
      refresh,
      clearError,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}