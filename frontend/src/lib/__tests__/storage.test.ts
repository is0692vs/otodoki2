/**
 * Usage examples and basic tests for localStorage utility
 * Run this in browser console to test functionality
 */

import {
  saveLikedTrack,
  getLikedTracks,
  removeLikedTrack,
  clearLikedTracks,
  saveDislikedTrack,
  getDislikedTracks,
  clearDislikedTracks,
  purgeExpiredDislikes,
  migrateStorageIfNeeded,
  isBrowser,
} from "@/lib/storage";
import { Track } from "@/services/types";

// Sample test data
const sampleTrack: Track = {
  id: 12345,
  title: "Test Song",
  artist: "Test Artist",
  artwork_url: "https://example.com/artwork.jpg",
  preview_url: "https://example.com/preview.mp3",
  album: "Test Album",
  genre: "Pop",
  duration_ms: 180000,
};

const sampleTrack2: Track = {
  id: "67890",
  title: "Another Song",
  artist: "Another Artist",
  artwork_url: "https://example.com/artwork2.jpg",
  preview_url: "https://example.com/preview2.mp3",
  album: "Another Album",
  genre: "Rock",
};

/**
 * Demo function to test storage functionality
 * Call this in browser console: testStorageBasics()
 */
export function testStorageBasics() {
  console.log("🧪 Testing localStorage utility...");

  if (!isBrowser()) {
    console.log("❌ Not in browser environment");
    return;
  }

  // Clear existing data
  clearLikedTracks();
  clearDislikedTracks();

  console.log("✅ Cleared existing data");

  // Test liked tracks
  console.log("\n📱 Testing liked tracks...");
  console.log("Saving track:", sampleTrack.title);
  saveLikedTrack(sampleTrack);

  console.log("Saving second track:", sampleTrack2.title);
  saveLikedTrack(sampleTrack2);

  const likedTracks = getLikedTracks();
  console.log("Retrieved liked tracks:", likedTracks.length);
  likedTracks.forEach((track, index) => {
    console.log(`  ${index + 1}. ${track.trackName} by ${track.artistName}`);
  });

  // Test disliked IDs
  console.log("\n👎 Testing disliked track IDs...");
  saveDislikedTrack(sampleTrack);
  saveDislikedTrack(sampleTrack2);

  const dislikedTracks = getDislikedTracks();
  console.log("Disliked tracks:", dislikedTracks.length);
  dislikedTracks.forEach((track, index) => {
    console.log(`  ${index + 1}. ${track.trackName} by ${track.artistName}`);
  });

  // Test removal
  console.log("\n🗑️ Testing removal...");
  console.log("Removing liked track:", sampleTrack.id);
  removeLikedTrack(sampleTrack.id);

  const remainingLiked = getLikedTracks();
  console.log("Remaining liked tracks:", remainingLiked.length);

  // Test migration
  console.log("\n🔄 Testing migration...");
  migrateStorageIfNeeded();
  console.log("Migration check completed");

  // Test purge
  console.log("\n🧹 Testing purge...");
  const purgedCount = purgeExpiredDislikes();
  console.log("Purged expired dislikes:", purgedCount);

  console.log("\n✅ All tests completed!");
}

/**
 * Demo function to test error handling
 */
export function testErrorHandling() {
  console.log("🧪 Testing error handling...");

  // Test invalid track data
  const invalidTrack = {
    id: "invalid",
    title: "",
    artist: "Test Artist",
  } as Track;

  const result = saveLikedTrack(invalidTrack);
  console.log("Save invalid track result:", result);

  // Test invalid track ID
  const result2 = saveDislikedTrack({ id: "invalid", title: "", artist: "" });
  console.log("Save invalid dislike ID result:", result2);

  console.log("✅ Error handling tests completed!");
}

/**
 * Demo function to show usage in swipe context
 */
export function demoSwipeUsage() {
  console.log("🎵 Demo: Swipe usage...");

  const handleSwipe = (direction: "left" | "right", track: Track) => {
    console.log(`Swiped ${direction} on:`, track.title);

    if (direction === "right") {
      // User liked the track
      const saved = saveLikedTrack(track);
      console.log("Saved to likes:", saved);
    } else {
      // User disliked the track
      const saved = saveDislikedTrack(track);
      console.log("Saved to dislikes:", saved);
    }
  };

  // Simulate swipes
  handleSwipe("right", sampleTrack);
  handleSwipe("left", sampleTrack2);

  // Show filtering example
  const dislikedTracksFiltered = new Set(getDislikedTracks().map(t => t.trackId));
  const candidateTracks = [sampleTrack, sampleTrack2];
  const filteredTracks = candidateTracks.filter(
    (track) => !dislikedTracksFiltered.has(Number(track.id))
  );

  console.log("Original tracks:", candidateTracks.length);
  console.log("Filtered tracks (excluding dislikes):", filteredTracks.length);

  console.log("✅ Swipe usage demo completed!");
}

// Export sample data for external testing
export { sampleTrack, sampleTrack2 };

// Make functions globally available in browser for console testing
if (typeof window !== "undefined") {
  // @ts-expect-error - Adding to global window for testing
  window.testStorageBasics = testStorageBasics;
  // @ts-expect-error - Adding to global window for testing
  window.testErrorHandling = testErrorHandling;
  // @ts-expect-error - Adding to global window for testing
  window.demoSwipeUsage = demoSwipeUsage;

  console.log("🧪 Storage test functions are now available in console:");
  console.log("  - testStorageBasics()");
  console.log("  - testErrorHandling()");
  console.log("  - demoSwipeUsage()");
}
