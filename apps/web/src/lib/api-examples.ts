/**
 * Example usage of the API client
 * This file demonstrates how to use the API client in your components
 */

import { api, type Track, type ApiResponse, type SuggestionsResponse } from '@/services';

// Example: Basic health check
export async function checkBackendHealth() {
  const response = await api.health();
  
  if (response.error) {
    console.error('Health check failed:', response.error);
    return false;
  }
  
  console.log('Backend is healthy:', response.data);
  return true;
}

// Example: Get track suggestions
export async function getRandomTracks(limit: number = 10): Promise<Track[]> {
  const response = await api.tracks.suggestions({ limit });
  
  if (response.error) {
    console.error('Failed to get tracks:', response.error);
    return [];
  }
  
  return response.data?.data || [];
}

// Example: Get tracks excluding certain IDs
export async function getTracksExcluding(excludeIds: string[], limit: number = 10): Promise<Track[]> {
  const excludeIdsString = excludeIds.join(',');
  const response = await api.tracks.suggestions({ limit, excludeIds: excludeIdsString });
  
  if (response.error) {
    console.error('Failed to get tracks:', response.error);
    return [];
  }
  
  return response.data?.data || [];
}

// Example: Monitor queue health
export async function monitorQueueHealth() {
  const response = await api.queue.health();
  
  if (response.error) {
    console.error('Failed to get queue health:', response.error);
    return null;
  }
  
  const health = response.data;
  if (!health) return null;
  
  console.log(`Queue Status: ${health.status}`);
  console.log(`Queue Size: ${health.size}/${health.capacity} (${health.utilization_percent.toFixed(1)}%)`);
  
  if (health.is_low_watermark) {
    console.warn('Queue is running low!');
  }
  
  return health;
}

// Example: Trigger refill if needed
export async function ensureQueueHasEnoughTracks() {
  const healthResponse = await api.queue.health();
  
  if (healthResponse.error) {
    console.error('Failed to check queue health:', healthResponse.error);
    return false;
  }
  
  const health = healthResponse.data;
  if (!health) return false;
  
  // If queue is low, trigger a refill
  if (health.is_low_watermark) {
    console.log('Queue is low, triggering refill...');
    const refillResponse = await api.worker.triggerRefill();
    
    if (refillResponse.error) {
      console.error('Failed to trigger refill:', refillResponse.error);
      return false;
    }
    
    console.log('Refill triggered:', refillResponse.data?.message);
    return refillResponse.data?.success || false;
  }
  
  return true;
}

// Example: Error handling with custom logic
export async function fetchTracksWithRetry(
  limit: number = 10, 
  maxRetries: number = 3
): Promise<ApiResponse<SuggestionsResponse>> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    const response = await api.tracks.suggestions({ limit });
    
    // If successful, return the response
    if (!response.error) {
      return response;
    }
    
    // If it's a rate limit error (429), wait and retry
    if (response.status === 429) {
      const retryAfter = 1000 * (attempts + 1); // Simple backoff
      console.log(`Rate limited, retrying after ${retryAfter}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      attempts++;
      continue;
    }
    
    // For other errors, return immediately
    return response;
  }
  
  // Max retries exceeded
  return {
    error: {
      error: 'Max retries exceeded',
      detail: 'Failed to fetch tracks after multiple attempts',
    },
    status: 0,
  };
}