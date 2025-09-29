/**
 * API Client adapted for React Native
 * Based on frontend/src/services/api-client.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiResponse,
  ApiClientConfig,
  HealthResponse,
  QueueStats,
  QueueHealth,
  WorkerStats,
  WorkerRefillResponse,
  SuggestionsResponse,
  SuggestionsStats,
  TokenBundleResponse,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  EvaluationListResponse,
  EvaluationCreateRequest,
  EvaluationResponse,
  EvaluationStatus,
  PlayHistoryCreateRequest,
  PlayHistoryResponse,
  ErrorResponse,
} from '../types/api';

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_BASE_URL = 'http://localhost:8000';

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private accessToken: string | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.loadTokenFromStorage();
  }

  private async loadTokenFromStorage() {
    try {
      const token = await AsyncStorage.getItem('access_token');
      this.accessToken = token;
    } catch (error) {
      console.warn('Failed to load access token from storage:', error);
    }
  }

  setAccessToken(token: string | null | undefined) {
    this.accessToken = token || null;
    if (token) {
      AsyncStorage.setItem('access_token', token);
    } else {
      AsyncStorage.removeItem('access_token');
    }
  }

  private async fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (this.accessToken) {
        headers.Authorization = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: ErrorResponse;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: `HTTP ${response.status}`,
            detail: response.statusText,
          };
        }
        return {
          error: errorData,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          error: {
            error: 'Request timeout',
            detail: `Request timed out after ${this.timeout}ms`,
          },
          status: 0,
        };
      }
      return {
        error: {
          error: 'Network error',
          detail: error instanceof Error ? error.message : String(error),
        },
        status: 0,
      };
    }
  }

  /**
   * GET /health - Basic health check
   */
  async health(): Promise<ApiResponse<HealthResponse>> {
    return this.fetchWithTimeout<HealthResponse>(`${this.baseUrl}/health`);
  }

  /**
   * GET /queue/health - Get queue health status
   */
  async getQueueHealth(): Promise<ApiResponse<QueueHealth>> {
    return this.fetchWithTimeout<QueueHealth>(`${this.baseUrl}/queue/health`);
  }

  /**
   * GET /queue/stats - Get queue statistics
   */
  async getQueueStats(): Promise<ApiResponse<QueueStats>> {
    return this.fetchWithTimeout<QueueStats>(`${this.baseUrl}/queue/stats`);
  }

  /**
   * GET /worker/stats - Get worker statistics
   */
  async getWorkerStats(): Promise<ApiResponse<WorkerStats>> {
    return this.fetchWithTimeout<WorkerStats>(`${this.baseUrl}/worker/stats`);
  }

  /**
   * POST /worker/trigger-refill - Trigger worker refill
   */
  async triggerWorkerRefill(): Promise<ApiResponse<WorkerRefillResponse>> {
    return this.fetchWithTimeout<WorkerRefillResponse>(
      `${this.baseUrl}/worker/trigger-refill`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * GET /api/v1/tracks/suggestions - Get track suggestions
   */
  async getTrackSuggestions(
    params: {
      limit?: number;
      excludeIds?: string;
    } = {}
  ): Promise<ApiResponse<SuggestionsResponse>> {
    const searchParams = new URLSearchParams();

    if (params.limit !== undefined) {
      searchParams.append('limit', params.limit.toString());
    }

    if (params.excludeIds) {
      searchParams.append('excludeIds', params.excludeIds);
    }

    const queryString = searchParams.toString();
    const url = `${this.baseUrl}/api/v1/tracks/suggestions${
      queryString ? `?${queryString}` : ''
    }`;

    return this.fetchWithTimeout<SuggestionsResponse>(url);
  }

  /**
   * GET /api/v1/tracks/suggestions/stats - Get suggestions API statistics
   */
  async getSuggestionsStats(): Promise<ApiResponse<SuggestionsStats>> {
    return this.fetchWithTimeout<SuggestionsStats>(
      `${this.baseUrl}/api/v1/tracks/suggestions/stats`
    );
  }

  /**
   * POST /api/v1/auth/register - Register a new user account
   */
  async register(
    payload: RegisterRequest
  ): Promise<ApiResponse<TokenBundleResponse>> {
    return this.fetchWithTimeout<TokenBundleResponse>(
      `${this.baseUrl}/api/v1/auth/register`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * POST /api/v1/auth/login - User login
   */
  async login(
    payload: LoginRequest
  ): Promise<ApiResponse<TokenBundleResponse>> {
    return this.fetchWithTimeout<TokenBundleResponse>(
      `${this.baseUrl}/api/v1/auth/login`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * POST /api/v1/auth/refresh - Refresh access token
   */
  async refresh(
    payload: RefreshTokenRequest
  ): Promise<ApiResponse<TokenBundleResponse>> {
    return this.fetchWithTimeout<TokenBundleResponse>(
      `${this.baseUrl}/api/v1/auth/refresh`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * GET /api/v1/evaluations - List user evaluations
   */
  async listEvaluations(
    params: {
      status?: EvaluationStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ApiResponse<EvaluationListResponse>> {
    const searchParams = new URLSearchParams();

    if (params.status) {
      searchParams.append('status', params.status);
    }
    if (params.limit !== undefined) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params.offset !== undefined) {
      searchParams.append('offset', params.offset.toString());
    }

    const queryString = searchParams.toString();
    const url = `${this.baseUrl}/api/v1/evaluations${
      queryString ? `?${queryString}` : ''
    }`;

    return this.fetchWithTimeout<EvaluationListResponse>(url);
  }

  /**
   * POST /api/v1/evaluations - Create an evaluation
   */
  async createEvaluation(
    payload: EvaluationCreateRequest
  ): Promise<ApiResponse<EvaluationResponse>> {
    return this.fetchWithTimeout<EvaluationResponse>(
      `${this.baseUrl}/api/v1/evaluations`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * DELETE /api/v1/evaluations/{external_track_id} - Delete an evaluation
   */
  async deleteEvaluation(externalTrackId: string): Promise<ApiResponse<void>> {
    return this.fetchWithTimeout<void>(
      `${this.baseUrl}/api/v1/evaluations/${encodeURIComponent(externalTrackId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * POST /api/v1/history/played - Record played history
   */
  async createPlayHistory(
    payload: PlayHistoryCreateRequest
  ): Promise<ApiResponse<PlayHistoryResponse>> {
    return this.fetchWithTimeout<PlayHistoryResponse>(
      `${this.baseUrl}/api/v1/history/played`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Export API methods for easy consumption
export const api = {
  health: () => apiClient.health(),
  queue: {
    health: () => apiClient.getQueueHealth(),
    stats: () => apiClient.getQueueStats(),
  },
  worker: {
    stats: () => apiClient.getWorkerStats(),
    triggerRefill: () => apiClient.triggerWorkerRefill(),
  },
  tracks: {
    suggestions: (params?: { limit?: number; excludeIds?: string }) =>
      apiClient.getTrackSuggestions(params || {}),
    stats: () => apiClient.getSuggestionsStats(),
  },
  auth: {
    register: (payload: RegisterRequest) => apiClient.register(payload),
    login: (payload: LoginRequest) => apiClient.login(payload),
    refresh: (payload: RefreshTokenRequest) => apiClient.refresh(payload),
    setToken: (token: string | null | undefined) =>
      apiClient.setAccessToken(token),
  },
  evaluations: {
    list: (params?: {
      status?: EvaluationStatus;
      limit?: number;
      offset?: number;
    }) => apiClient.listEvaluations(params || {}),
    create: (payload: EvaluationCreateRequest) =>
      apiClient.createEvaluation(payload),
    delete: (externalTrackId: string) =>
      apiClient.deleteEvaluation(externalTrackId),
  },
  history: {
    createPlayed: (payload: PlayHistoryCreateRequest) =>
      apiClient.createPlayHistory(payload),
  },
};