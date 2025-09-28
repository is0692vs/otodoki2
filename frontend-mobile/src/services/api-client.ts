/**
 * API client for React Native mobile app
 * Provides typed functions for all backend endpoints
 */

import {
  ApiClientConfig,
  ApiResponse,
  HealthResponse,
  QueueStats,
  QueueHealth,
  WorkerStats,
  WorkerRefillResponse,
  SuggestionsResponse,
  SuggestionsStats,
  ErrorResponse,
  TokenBundleResponse,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  EvaluationCreateRequest,
  EvaluationListResponse,
  EvaluationResponse,
  EvaluationStatus,
  PlayHistoryCreateRequest,
  PlayHistoryResponse,
} from '../types';

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private accessToken?: string;

  constructor(config: ApiClientConfig = {}) {
    // Default to localhost for development, should be configured for production
    this.baseUrl = config.baseUrl || "http://localhost:8000";
    this.timeout = config.timeout || 10000; // 10 seconds default timeout
  }

  /**
   * Generic fetch wrapper with error handling and timeout
   */
  private async fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers = new Headers({ "Content-Type": "application/json" });

      const incomingHeaders =
        options.headers instanceof Headers
          ? options.headers
          : new Headers(options.headers ?? {});

      incomingHeaders.forEach((value, key) => {
        headers.set(key, value);
      });

      if (this.accessToken) {
        headers.set("Authorization", `Bearer ${this.accessToken}`);
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error response
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

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        return {
          data,
          status: response.status,
        };
      }

      const textData = await response.text();
      if (textData) {
        return {
          data: textData as unknown as T,
          status: response.status,
        };
      }

      return {
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            error: {
              error: "Request timeout",
              detail: `Request timed out after ${this.timeout}ms`,
            },
            status: 408,
          };
        }

        return {
          error: {
            error: "Network error",
            detail: error.message,
          },
          status: 0,
        };
      }

      return {
        error: {
          error: "Unknown error",
          detail: "An unexpected error occurred",
        },
        status: 0,
      };
    }
  }

  setAccessToken(token: string | null | undefined): void {
    this.accessToken = token || undefined;
  }

  /**
   * GET /health - Check backend health
   */
  async getHealth(): Promise<ApiResponse<HealthResponse>> {
    return this.fetchWithTimeout<HealthResponse>(`${this.baseUrl}/health`);
  }

  /**
   * GET /queue/stats - Get queue statistics
   */
  async getQueueStats(): Promise<ApiResponse<QueueStats>> {
    return this.fetchWithTimeout<QueueStats>(`${this.baseUrl}/queue/stats`);
  }

  /**
   * GET /queue/health - Get queue health status
   */
  async getQueueHealth(): Promise<ApiResponse<QueueHealth>> {
    return this.fetchWithTimeout<QueueHealth>(`${this.baseUrl}/queue/health`);
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
        method: "POST",
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
      searchParams.append("limit", params.limit.toString());
    }

    if (params.excludeIds) {
      searchParams.append("excludeIds", params.excludeIds);
    }

    const queryString = searchParams.toString();
    const url = `${this.baseUrl}/api/v1/tracks/suggestions${
      queryString ? `?${queryString}` : ""
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
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * POST /api/v1/auth/login - Login existing user
   */
  async login(
    payload: LoginRequest
  ): Promise<ApiResponse<TokenBundleResponse>> {
    return this.fetchWithTimeout<TokenBundleResponse>(
      `${this.baseUrl}/api/v1/auth/login`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * POST /api/v1/auth/refresh - Refresh authentication tokens
   */
  async refresh(
    payload: RefreshTokenRequest
  ): Promise<ApiResponse<TokenBundleResponse>> {
    return this.fetchWithTimeout<TokenBundleResponse>(
      `${this.baseUrl}/api/v1/auth/refresh`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * GET /api/v1/evaluations - List evaluations for current user
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
      searchParams.append("status", params.status);
    }

    if (params.limit !== undefined) {
      searchParams.append("limit", params.limit.toString());
    }

    if (params.offset !== undefined) {
      searchParams.append("offset", params.offset.toString());
    }

    const queryString = searchParams.toString();
    const url = `${this.baseUrl}/api/v1/evaluations${
      queryString ? `?${queryString}` : ""
    }`;

    return this.fetchWithTimeout<EvaluationListResponse>(url);
  }

  /**
   * POST /api/v1/evaluations - Create a new evaluation for current user
   */
  async createEvaluation(
    payload: EvaluationCreateRequest
  ): Promise<ApiResponse<EvaluationResponse>> {
    return this.fetchWithTimeout<EvaluationResponse>(
      `${this.baseUrl}/api/v1/evaluations`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * DELETE /api/v1/evaluations/{external_track_id} - Delete an evaluation for current user
   */
  async deleteEvaluation(externalTrackId: string): Promise<ApiResponse<void>> {
    return this.fetchWithTimeout<void>(
      `${this.baseUrl}/api/v1/evaluations/${encodeURIComponent(
        externalTrackId
      )}`,
      {
        method: "DELETE",
      }
    );
  }

  /**
   * POST /api/v1/history/played - Record a playback event for the current user
   */
  async recordPlayback(
    payload: PlayHistoryCreateRequest
  ): Promise<ApiResponse<PlayHistoryResponse>> {
    return this.fetchWithTimeout<PlayHistoryResponse>(
      `${this.baseUrl}/api/v1/history/played`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }
}

// Default client instance
export const apiClient = new ApiClient();

// Helper functions for easier usage
export const api = {
  health: () => apiClient.getHealth(),
  queue: {
    stats: () => apiClient.getQueueStats(),
    health: () => apiClient.getQueueHealth(),
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
    played: (payload: PlayHistoryCreateRequest) =>
      apiClient.recordPlayback(payload),
  },
};