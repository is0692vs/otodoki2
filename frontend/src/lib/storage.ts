/**
 * LocalStorage utility for otodoki2web
 * Safely stores and retrieves liked tracks and disliked track IDs
 * with SSR compatibility and error handling
 */

import { Track } from "@/services/types";

// Environment configuration with defaults
const LIKES_MAX = parseInt(process.env.NEXT_PUBLIC_LIKES_MAX || "500", 10);
const DISLIKES_MAX = parseInt(
  process.env.NEXT_PUBLIC_DISLIKES_MAX || "1000",
  10
);
const DISLIKE_TTL_SEC = parseInt(
  process.env.NEXT_PUBLIC_DISLIKE_TTL_SEC || "2592000",
  10
); // 30 days

// Storage keys
const LIKES_KEY = "otodoki2:likes:v1";
const DISLIKES_KEY = "otodoki2:dislikes:v1";

// Storage schemas
interface StoredTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl: string;
  previewUrl: string;
  collectionName?: string;
  primaryGenreName?: string;
  savedAt: string; // ISO8601
}

interface LikesStorage {
  version: 1;
  items: StoredTrack[];
}

interface DislikedItem {
  id: number;
  dislikedAt: string; // ISO8601
  ttlSec?: number;
}

interface DislikesStorage {
  version: 1;
  items: DislikedItem[];
}

interface SaveDislikedOptions {
  ttlSec?: number;
}

// Logging utility
const log = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[Storage] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Storage] ${message}`, ...args);
    }
  },
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[Storage] ${message}`, error);
    }
  },
};

/**
 * Check if code is running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Safe localStorage operations with error handling
 */
const storage = {
  get(key: string): string | null {
    if (!isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      log.warn(`Failed to read from localStorage key: ${key}`, error);
      return null;
    }
  },

  set(key: string, value: string): boolean {
    if (!isBrowser()) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      log.warn(`Failed to write to localStorage key: ${key}`, error);
      return false;
    }
  },

  remove(key: string): boolean {
    if (!isBrowser()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      log.warn(`Failed to remove localStorage key: ${key}`, error);
      return false;
    }
  },
};

/**
 * Normalize track ID to number
 */
function normalizeTrackId(id: string | number): number {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  if (isNaN(numId) || numId <= 0) {
    throw new Error(`Invalid track ID: ${id}`);
  }
  return numId;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Convert Track to StoredTrack with validation
 */
function normalizeTrack(track: Track): StoredTrack {
  const trackId = normalizeTrackId(track.id);

  if (!track.title || typeof track.title !== "string") {
    throw new Error("Track title is required and must be a string");
  }

  if (!track.artist || typeof track.artist !== "string") {
    throw new Error("Track artist is required and must be a string");
  }

  // Validate URLs if provided
  let artworkUrl = track.artwork_url || "";
  let previewUrl = track.preview_url || "";

  if (artworkUrl && !isValidUrl(artworkUrl)) {
    log.warn(`Invalid artwork URL for track ${track.id}: ${artworkUrl}`);
    artworkUrl = "";
  }

  if (previewUrl && !isValidUrl(previewUrl)) {
    log.warn(`Invalid preview URL for track ${track.id}: ${previewUrl}`);
    previewUrl = "";
  }

  return {
    trackId,
    trackName: track.title,
    artistName: track.artist,
    artworkUrl,
    previewUrl,
    collectionName: track.album,
    primaryGenreName: track.genre,
    savedAt: new Date().toISOString(),
  };
}

/**
 * Load likes from storage with error recovery
 */
function loadLikes(): LikesStorage {
  const raw = storage.get(LIKES_KEY);
  if (!raw) {
    return { version: 1, items: [] };
  }

  try {
    const parsed = JSON.parse(raw) as LikesStorage;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.items)
    ) {
      throw new Error("Invalid likes storage format");
    }
    return parsed;
  } catch (error) {
    log.warn(
      "Corrupted likes storage detected, backing up and reinitializing",
      error
    );
    // Backup corrupted data
    const backupKey = `otodoki2:likes:corrupt:${Date.now()}`;
    storage.set(backupKey, raw);
    // Initialize fresh storage
    const fresh: LikesStorage = { version: 1, items: [] };
    storage.set(LIKES_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

/**
 * Save likes to storage
 */
function saveLikes(data: LikesStorage): boolean {
  return storage.set(LIKES_KEY, JSON.stringify(data));
}

/**
 * Load dislikes from storage with error recovery
 */
function loadDislikes(): DislikesStorage {
  const raw = storage.get(DISLIKES_KEY);
  if (!raw) {
    return { version: 1, items: [] };
  }

  try {
    const parsed = JSON.parse(raw) as DislikesStorage;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.items)
    ) {
      throw new Error("Invalid dislikes storage format");
    }
    return parsed;
  } catch (error) {
    log.warn(
      "Corrupted dislikes storage detected, backing up and reinitializing",
      error
    );
    // Backup corrupted data
    const backupKey = `otodoki2:dislikes:corrupt:${Date.now()}`;
    storage.set(backupKey, raw);
    // Initialize fresh storage
    const fresh: DislikesStorage = { version: 1, items: [] };
    storage.set(DISLIKES_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

/**
 * Save dislikes to storage
 */
function saveDislikes(data: DislikesStorage): boolean {
  return storage.set(DISLIKES_KEY, JSON.stringify(data));
}

/**
 * Remove expired dislikes from array
 */
function removeExpiredDislikes(items: DislikedItem[]): DislikedItem[] {
  const now = new Date();
  return items.filter((item) => {
    const dislikedAt = new Date(item.dislikedAt);
    const ttlMs = (item.ttlSec || DISLIKE_TTL_SEC) * 1000;
    return now.getTime() - dislikedAt.getTime() < ttlMs;
  });
}

/**
 * Trim array to max size, keeping newest items
 */
function trimToMaxSize<T extends { savedAt?: string; dislikedAt?: string }>(
  items: T[],
  maxSize: number
): T[] {
  if (items.length <= maxSize) return items;

  // Sort by timestamp (newest first)
  const sorted = [...items].sort((a, b) => {
    const timeA = a.savedAt || a.dislikedAt || "";
    const timeB = b.savedAt || b.dislikedAt || "";
    return timeB.localeCompare(timeA);
  });

  return sorted.slice(0, maxSize);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Save a liked track to localStorage
 * @param track Track to save
 * @returns true if saved successfully
 */
export function saveLikedTrack(track: Track): boolean {
  if (!isBrowser()) {
    log.info("saveLikedTrack: SSR environment, skipping");
    return false;
  }

  try {
    const storedTrack = normalizeTrack(track);
    const likes = loadLikes();

    // Check for existing track
    const existingIndex = likes.items.findIndex(
      (item) => item.trackId === storedTrack.trackId
    );

    if (existingIndex >= 0) {
      // Update savedAt of existing track
      likes.items[existingIndex].savedAt = storedTrack.savedAt;
      log.info(
        `Updated existing liked track: ${storedTrack.trackName} by ${storedTrack.artistName}`
      );
    } else {
      // Add new track
      likes.items.push(storedTrack);
      log.info(
        `Saved new liked track: ${storedTrack.trackName} by ${storedTrack.artistName}`
      );
    }

    // Trim to max size if needed
    likes.items = trimToMaxSize(likes.items, LIKES_MAX);

    const success = saveLikes(likes);
    if (success) {
      log.info(`Likes storage updated, total count: ${likes.items.length}`);
    }
    return success;
  } catch (error) {
    log.error("Failed to save liked track", error);
    return false;
  }
}

/**
 * Get all liked tracks, newest first
 * @returns Array of stored tracks
 */
export function getLikedTracks(): StoredTrack[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const likes = loadLikes();
    // Return newest first
    return [...likes.items].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch (error) {
    log.error("Failed to get liked tracks", error);
    return [];
  }
}

/**
 * Remove a liked track by ID
 * @param trackId Track ID to remove
 * @returns true if removed successfully
 */
export function removeLikedTrack(trackId: string | number): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const normalizedId = normalizeTrackId(trackId);
    const likes = loadLikes();
    const initialCount = likes.items.length;

    likes.items = likes.items.filter((item) => item.trackId !== normalizedId);

    if (likes.items.length < initialCount) {
      const success = saveLikes(likes);
      if (success) {
        log.info(
          `Removed liked track ID: ${normalizedId}, new count: ${likes.items.length}`
        );
      }
      return success;
    }

    return true; // Track didn't exist, consider it successful
  } catch (error) {
    log.error("Failed to remove liked track", error);
    return false;
  }
}

/**
 * Clear all liked tracks
 * @returns true if cleared successfully
 */
export function clearLikedTracks(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const success = storage.remove(LIKES_KEY);
    if (success) {
      log.info("Cleared all liked tracks");
    }
    return success;
  } catch (error) {
    log.error("Failed to clear liked tracks", error);
    return false;
  }
}

/**
 * Save a disliked track ID
 * @param trackId Track ID to dislike
 * @param opts Options including TTL
 * @returns true if saved successfully
 */
export function saveDislikedTrackId(
  trackId: string | number,
  opts?: SaveDislikedOptions
): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const normalizedId = normalizeTrackId(trackId);
    const dislikes = loadDislikes();

    // Check for existing dislike
    const existingIndex = dislikes.items.findIndex(
      (item) => item.id === normalizedId
    );
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Update existing dislike
      dislikes.items[existingIndex].dislikedAt = now;
      if (opts?.ttlSec !== undefined) {
        dislikes.items[existingIndex].ttlSec = opts.ttlSec;
      }
      log.info(`Updated existing disliked track ID: ${normalizedId}`);
    } else {
      // Add new dislike
      dislikes.items.push({
        id: normalizedId,
        dislikedAt: now,
        ttlSec: opts?.ttlSec || DISLIKE_TTL_SEC,
      });
      log.info(`Saved new disliked track ID: ${normalizedId}`);
    }

    // Trim to max size if needed
    dislikes.items = trimToMaxSize(dislikes.items, DISLIKES_MAX);

    const success = saveDislikes(dislikes);
    if (success) {
      log.info(
        `Dislikes storage updated, total count: ${dislikes.items.length}`
      );
    }
    return success;
  } catch (error) {
    log.error("Failed to save disliked track ID", error);
    return false;
  }
}

/**
 * Get all disliked track IDs (excluding expired ones)
 * @returns Array of disliked track IDs
 */
export function getDislikedTrackIds(): number[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const dislikes = loadDislikes();
    const validItems = removeExpiredDislikes(dislikes.items);

    // Update storage if expired items were removed
    if (validItems.length !== dislikes.items.length) {
      dislikes.items = validItems;
      saveDislikes(dislikes);
      log.info(
        `Purged expired dislikes, remaining count: ${validItems.length}`
      );
    }

    return validItems.map((item) => item.id);
  } catch (error) {
    log.error("Failed to get disliked track IDs", error);
    return [];
  }
}

/**
 * Clear all disliked track IDs
 * @returns true if cleared successfully
 */
export function clearDislikedTrackIds(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const success = storage.remove(DISLIKES_KEY);
    if (success) {
      log.info("Cleared all disliked track IDs");
    }
    return success;
  } catch (error) {
    log.error("Failed to clear disliked track IDs", error);
    return false;
  }
}

/**
 * Manually purge expired dislikes
 * @returns number of items removed
 */
export function purgeExpiredDislikes(): number {
  if (!isBrowser()) {
    return 0;
  }

  try {
    const dislikes = loadDislikes();
    const initialCount = dislikes.items.length;
    dislikes.items = removeExpiredDislikes(dislikes.items);

    const removedCount = initialCount - dislikes.items.length;
    if (removedCount > 0) {
      saveDislikes(dislikes);
      log.info(
        `Purged ${removedCount} expired dislikes, remaining: ${dislikes.items.length}`
      );
    }

    return removedCount;
  } catch (error) {
    log.error("Failed to purge expired dislikes", error);
    return 0;
  }
}

/**
 * Migrate storage from older versions if needed
 * This is a placeholder for future schema migrations
 */
export function migrateStorageIfNeeded(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    // Check for v0 or legacy formats and migrate
    // Currently v1 is the first version, so no migration needed
    const legacyLikesKey = "otodoki2:likes";
    const legacyDislikesKey = "otodoki2:dislikes";

    const legacyLikes = storage.get(legacyLikesKey);
    const legacyDislikes = storage.get(legacyDislikesKey);

    let migrated = false;

    if (legacyLikes) {
      log.info("Migrating legacy likes storage");
      storage.remove(legacyLikesKey);
      migrated = true;
    }

    if (legacyDislikes) {
      log.info("Migrating legacy dislikes storage");
      storage.remove(legacyDislikesKey);
      migrated = true;
    }

    if (migrated) {
      log.info("Storage migration completed");
    }
  } catch (error) {
    log.error("Failed to migrate storage", error);
  }
}

// Initialize migration on module load
if (isBrowser()) {
  migrateStorageIfNeeded();
}