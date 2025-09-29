/**
 * TypeScript types for backend API responses
 * Adapted from frontend services/types.ts for React Native
 */

// Track model
export interface Track {
  id: string | number;
  title: string;
  artist: string;
  artwork_url?: string;
  preview_url?: string;
  album?: string;
  duration_ms?: number;
  genre?: string;
}

// Health check response
export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime_seconds: number;
  service: string;
}

// Queue stats response
export interface QueueStats {
  current_size: number;
  max_capacity: number;
  utilization: number;
  is_low: boolean;
}

// Queue health response
export interface QueueHealth {
  status: "healthy" | "low";
  size: number;
  capacity: number;
  utilization_percent: number;
  is_low_watermark: boolean;
}

// Worker stats response
export interface WorkerStats {
  running: boolean;
  consecutive_failures: number;
  max_failures: number;
  refill_in_progress: boolean;
  poll_interval_ms: number;
  min_threshold: number;
  batch_size: number;
  max_cap: number;
}

// Worker refill response
export interface WorkerRefillResponse {
  success: boolean;
  message: string;
}

// Suggestions meta data
export interface SuggestionsMeta {
  requested: number;
  delivered: number;
  queue_size_after: number;
  refill_triggered: boolean;
  ts: string;
}

// Suggestions response
export interface SuggestionsResponse {
  data: Track[];
  meta: SuggestionsMeta;
}

// Suggestions stats response
export interface SuggestionsStats {
  rate_limit: {
    current_count: number;
    max_count: number;
    window_size_s: number;
    reset_time_s: number;
  };
}

// Error response
export interface ErrorResponse {
  error: string;
  detail?: string;
}

// User profile response
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string | null;
  created_at: string;
  updated_at: string;
}

// Token bundle returned from auth endpoints
export interface TokenBundleResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  user: UserProfile;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// API client configuration
export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
}

// API response wrapper for consistent error handling
export interface ApiResponse<T> {
  data?: T;
  error?: ErrorResponse;
  status: number;
}

// Evaluation types
export type EvaluationStatus = "like" | "dislike" | "skip";

export interface EvaluationTrackPayload {
  external_id: string;
  source?: string | null;
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  artwork_url?: string | null;
  preview_url?: string | null;
  primary_genre?: string | null;
  duration_ms?: number | null;
}

export interface EvaluationResponse {
  id: string;
  external_track_id: string;
  status: EvaluationStatus;
  note?: string | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  track?: EvaluationTrackPayload | null;
}

export interface EvaluationListResponse {
  items: EvaluationResponse[];
  limit: number;
  offset: number;
  total: number;
}

export interface EvaluationCreateRequest {
  track: EvaluationTrackPayload;
  status: EvaluationStatus;
  note?: string | null;
  source?: string | null;
}

export interface PlayHistoryCreateRequest {
  track: EvaluationTrackPayload;
  source?: string | null;
  played_at?: string | null;
}

export interface PlayHistoryResponse {
  id: string;
  external_track_id: string;
  source?: string | null;
  played_at?: string | null;
  track?: EvaluationTrackPayload | null;
}