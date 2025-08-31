# localStorage Utility Documentation

## Overview

This localStorage utility provides safe storage and retrieval of liked tracks and disliked track IDs for the otodoki2web application. It includes SSR compatibility, error handling, and automatic data migration.

## Features

- **SSR Safe**: All functions work correctly in server-side rendering environments
- **Error Resilient**: Handles localStorage errors gracefully without breaking the application
- **Data Validation**: Validates track data and URLs before storage
- **Auto-Migration**: Migrates from older storage formats automatically
- **TTL Support**: Disliked tracks expire automatically after configurable periods
- **Size Limits**: Prevents storage bloat with configurable maximum limits
- **JSON Corruption Recovery**: Automatically recovers from corrupted storage data

## API Reference

### Core Functions

#### `saveLikedTrack(track: Track): boolean`

Saves a track to the liked tracks collection.

- **Parameters**: `track` - Track object to save
- **Returns**: `true` if saved successfully, `false` otherwise
- **Behavior**:
  - Validates track data before saving
  - Updates `savedAt` timestamp if track already exists
  - Automatically trims collection if it exceeds maximum size

#### `getLikedTracks(): StoredTrack[]`

Retrieves all liked tracks, sorted by newest first.

- **Returns**: Array of stored track objects
- **Behavior**: Returns empty array in SSR environment or on errors

#### `removeLikedTrack(trackId: string | number): boolean`

Removes a specific track from the liked collection.

- **Parameters**: `trackId` - ID of track to remove
- **Returns**: `true` if removed successfully (or didn't exist)

#### `clearLikedTracks(): boolean`

Removes all liked tracks from storage.

- **Returns**: `true` if cleared successfully

#### `saveDislikedTrackId(trackId: string | number, opts?: SaveDislikedOptions): boolean`

Saves a track ID to the disliked collection.

- **Parameters**:
  - `trackId` - Track ID to dislike
  - `opts` - Optional configuration including custom TTL
- **Returns**: `true` if saved successfully

#### `getDislikedTrackIds(): number[]`

Gets all current disliked track IDs (excluding expired ones).

- **Returns**: Array of disliked track IDs
- **Side Effect**: Automatically purges expired entries

#### `clearDislikedTrackIds(): boolean`

Removes all disliked track IDs from storage.

- **Returns**: `true` if cleared successfully

### Utility Functions

#### `purgeExpiredDislikes(): number`

Manually removes expired disliked track IDs.

- **Returns**: Number of items removed

#### `migrateStorageIfNeeded(): void`

Migrates storage from older formats if necessary.

- **Behavior**: Safe to call multiple times

#### `isBrowser(): boolean`

Checks if code is running in browser environment.

- **Returns**: `true` if in browser, `false` in SSR

## Usage Examples

### Basic Swipe Integration

```typescript
import { saveLikedTrack, saveDislikedTrackId } from "@/lib/storage";

const handleSwipe = (direction: "left" | "right", track: Track) => {
  if (direction === "right") {
    // User liked the track
    saveLikedTrack(track);
  } else {
    // User disliked the track
    saveDislikedTrackId(track.id);
  }
};
```

### Filtering Disliked Tracks

```typescript
import { getDislikedTrackIds } from "@/lib/storage";

const loadTracks = async () => {
  const dislikedIds = new Set(getDislikedTrackIds());
  const tracks = await fetchTracksFromAPI();

  // Filter out disliked tracks
  const filteredTracks = tracks.filter(
    (track) => !dislikedIds.has(Number(track.id))
  );

  return filteredTracks;
};
```

### Library Page Implementation

```typescript
import { getLikedTracks, removeLikedTrack } from "@/lib/storage";

const LibraryPage = () => {
  const [likedTracks, setLikedTracks] = useState([]);

  useEffect(() => {
    const tracks = getLikedTracks();
    setLikedTracks(tracks);
  }, []);

  const handleRemoveTrack = (trackId) => {
    removeLikedTrack(trackId);
    // Reload tracks
    setLikedTracks(getLikedTracks());
  };

  // ... render logic
};
```

## Configuration

Environment variables control storage behavior:

```bash
# Maximum liked tracks (default: 500)
NEXT_PUBLIC_LIKES_MAX=500

# Maximum disliked track IDs (default: 1000)
NEXT_PUBLIC_DISLIKES_MAX=1000

# Dislike TTL in seconds (default: 2592000 = 30 days)
NEXT_PUBLIC_DISLIKE_TTL_SEC=2592000
```

## Data Schemas

### Liked Tracks Storage

```
Key: "otodoki2:likes:v1"
Value: {
  version: 1,
  items: [{
    trackId: number,
    trackName: string,
    artistName: string,
    artworkUrl: string,
    previewUrl: string,
    collectionName?: string,
    primaryGenreName?: string,
    savedAt: string (ISO8601)
  }]
}
```

### Disliked Track IDs Storage

```
Key: "otodoki2:dislikes:v1"
Value: {
  version: 1,
  items: [{
    id: number,
    dislikedAt: string (ISO8601),
    ttlSec?: number
  }]
}
```

## Error Handling

The utility handles various error scenarios gracefully:

- **localStorage unavailable**: Functions return safe defaults without throwing
- **Storage quota exceeded**: Operations fail gracefully with warning logs
- **Corrupted JSON data**: Automatically backs up corrupt data and reinitializes
- **Invalid track data**: Validation prevents saving malformed data
- **SSR environment**: All functions work safely on the server

## Testing

### Development Environment

The application automatically loads development tools in development mode. Test functions are available in the browser console:

```javascript
// Test basic functionality
testStorageBasics();

// Test error handling
testErrorHandling();

// Demo swipe usage
demoSwipeUsage();
```

### Manual Testing

Use the provided test functions in browser console:

```javascript
// Test basic functionality
testStorageBasics();

// Test error handling
testErrorHandling();

// Demo swipe usage
demoSwipeUsage();
```

### Production Environment

Test functions are not loaded in production builds to minimize bundle size and maintain security.

## Migration

The utility automatically migrates from older storage formats. Legacy keys are removed after successful migration:

- `otodoki2:likes` → `otodoki2:likes:v1`
- `otodoki2:dislikes` → `otodoki2:dislikes:v1`

## Performance Considerations

- **Lazy Loading**: Storage is only accessed when needed
- **Batch Operations**: Size trimming only occurs when limits are exceeded
- **Efficient Filtering**: Uses Set for O(1) dislike lookups
- **Minimal Parsing**: JSON parsing only happens when data is actually needed

## Browser Compatibility

The utility works in all modern browsers that support:

- localStorage API
- JSON.parse/stringify
- ES6+ features (Set, Array methods)

For older browsers, consider polyfills for missing features.
