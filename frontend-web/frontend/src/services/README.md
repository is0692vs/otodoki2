# API Client Services

This directory contains TypeScript API client functions for communicating with the otodoki2 backend API.

## Structure

- `types.ts` - TypeScript type definitions matching backend Pydantic models
- `api-client.ts` - Main API client class and helper functions
- `index.ts` - Module exports

## Usage

### Basic Import

```typescript
import { api } from '@/services';
```

### Available Endpoints

#### Health Check
```typescript
const response = await api.health();
if (response.data) {
  console.log('Backend status:', response.data.status);
}
```

#### Queue Management
```typescript
// Get queue statistics
const queueStats = await api.queue.stats();

// Check queue health
const queueHealth = await api.queue.health();
```

#### Worker Management
```typescript
// Get worker statistics
const workerStats = await api.worker.stats();

// Trigger manual refill
const refillResult = await api.worker.triggerRefill();
```

#### Track Suggestions (Main API)
```typescript
// Get 10 random tracks
const tracks = await api.tracks.suggestions({ limit: 10 });

// Get tracks excluding specific IDs
const tracks = await api.tracks.suggestions({ 
  limit: 15, 
  excludeIds: "123,456,789" 
});

// Get API statistics
const stats = await api.tracks.stats();
```

## Error Handling

All API functions return an `ApiResponse<T>` object with either `data` or `error`:

```typescript
const response = await api.tracks.suggestions({ limit: 5 });

if (response.error) {
  console.error('API Error:', response.error.error);
  console.error('Details:', response.error.detail);
  console.error('Status Code:', response.status);
} else {
  const tracks = response.data.data; // Array of Track objects
  console.log('Received tracks:', tracks);
}
```

## Configuration

The API client can be configured with a custom base URL and timeout:

```typescript
import { ApiClient } from '@/services';

const customClient = new ApiClient({
  baseUrl: 'https://api.example.com',
  timeout: 5000, // 5 seconds
});
```

Or use environment variables:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Examples

See `src/lib/api-examples.ts` for comprehensive usage examples including:
- Error handling with retries
- Queue monitoring
- Rate limit handling
- Automatic refill triggering

## Type Safety

All responses are fully typed based on the backend Pydantic models:

```typescript
import { type Track, type SuggestionsResponse } from '@/services';

const response = await api.tracks.suggestions({ limit: 10 });
if (response.data) {
  const tracks: Track[] = response.data.data;
  tracks.forEach(track => {
    console.log(`${track.artist} - ${track.title}`);
    if (track.preview_url) {
      // TypeScript knows this is optional
      console.log('Preview available:', track.preview_url);
    }
  });
}
```

## Network Configuration

The backend CORS is configured to allow requests from `http://localhost:3000` (the default Next.js development server).

For production, ensure the backend `ORIGINS` environment variable includes your frontend domain.