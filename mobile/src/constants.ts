/**
 * Application-wide constants for the mobile app.
 */

/**
 * API Configuration
 */
// Default to localhost for development
// For Dev Containers, set EXPO_PUBLIC_API_URL environment variable to host machine's IP
// Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:8000 npx expo start --tunnel
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Swipe screen loading strategy constants
 */

// The number of tracks to fetch on initial load
export const INITIAL_TRACKS_LIMIT = 20;

// The number of tracks to fetch when refilling the queue
export const REFILL_TRACKS_LIMIT = 10;

// The number of tracks remaining in the swipe queue that triggers fetching more
export const REFILL_THRESHOLD = 5;
