"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { api, type Track } from "@/services";
import {
  getDislikedTracks,
  saveLikedTrack,
  saveDislikedTrack,
} from "@/lib/storage";
import { useAudioPlayer } from "./useAudioPlayer";

const MIN_DECK_SIZE = 5;
const REFILL_THRESHOLD = 3;
const FETCH_BATCH_SIZE = 10;
const MAX_REFILL_ATTEMPTS = 3;

// A simple in-memory cache to avoid re-fetching the same tracks in a session.
const sessionFetchedTrackIds = new Set<string | number>();

/**
 * Manages the state and logic for the swipeable track deck.
 *
 * @returns An object containing the visible tracks, swipe handlers, and loading state.
 */
export function useSwipeDeck() {
  const [rawTracks, setRawTracks] = useState<Track[]>([]);
  const [isFetching, setIsFetching] = useState(true); // Start with true for initial load
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Use a ref to store disliked IDs to avoid re-renders when it changes.
  const dislikedIds = useRef<Set<string | number>>(
    new Set(getDislikedTracks().map((t) => t.trackId))
  );

  const audioPlayer = useAudioPlayer({
    volume: 0.7,
    onPlaybackError: (error) => {
      console.warn("Audio playback error:", error);
    },
  });

  // Memoize the visible tracks to prevent re-filtering on every render.
  const visibleTracks = useMemo(() => {
    return rawTracks.filter((track) => !dislikedIds.current.has(track.id));
  }, [rawTracks]);

  const prefetchTracks = useCallback(async (attempt = 0) => {
    if (isFetching && attempt === 0) return; // Prevent concurrent initial fetches
    setIsFetching(true);
    setFetchError(null);

    try {
      const response = await api.tracks.suggestions({ limit: FETCH_BATCH_SIZE });
      if (response.error) {
        throw new Error(response.error.error);
      }

      const newTracks = response.data?.data || [];

      // Filter out tracks that are already in the raw list or session cache
      const uniqueNewTracks = newTracks.filter(
        (track) => !sessionFetchedTrackIds.has(track.id)
      );

      // Update session cache
      uniqueNewTracks.forEach((track) => sessionFetchedTrackIds.add(track.id));

      // Add new unique tracks to the deck
      let updatedTracks: Track[] = [];
      setRawTracks((prev) => {
        updatedTracks = [...prev, ...uniqueNewTracks];
        return updatedTracks;
      });

      // After adding tracks, check if we need to retry fetching.
      const stillVisible = updatedTracks.filter(
        (track) => !dislikedIds.current.has(track.id)
      );

      if (
        stillVisible.length < MIN_DECK_SIZE &&
        attempt < MAX_REFILL_ATTEMPTS
      ) {
        console.log(
          `Deck is below minimum size (${stillVisible.length}/${MIN_DECK_SIZE}). Refetching... (Attempt ${
            attempt + 2
          })`
        );
        // Wait a bit before retrying to avoid spamming the API
        await new Promise((resolve) => setTimeout(resolve, 500));
        await prefetchTracks(attempt + 1);
      }
    } catch (error) {
      console.error("Failed to fetch tracks:", error);
      setFetchError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsFetching(false);
    }
  }, [isFetching]);

  // Initial data load
  useEffect(() => {
    prefetchTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor deck size and prefetch more tracks when it gets low.
  useEffect(() => {
    if (!isFetching && visibleTracks.length <= REFILL_THRESHOLD) {
      console.log(
        `Deck is at threshold (${visibleTracks.length}/${REFILL_THRESHOLD}). Prefetching more tracks.`
      );
      prefetchTracks();
    }
  }, [visibleTracks.length, isFetching, prefetchTracks]);

  // Audio playback effect for the top card
  useEffect(() => {
    const topTrack = visibleTracks[0];
    if (topTrack) {
      audioPlayer.playTrack(topTrack);
    } else {
      audioPlayer.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTracks[0]?.id]);

  const handleSwipe = useCallback(
    (direction: "left" | "right", swipedTrack: Track) => {
      // Stop audio for the swiped card
      audioPlayer.stop();

      if (direction === "right") {
        try {
          saveLikedTrack(swipedTrack);
        } catch (e) {
          console.warn("Failed to save liked track:", e);
        }
      } else {
        try {
          saveDislikedTrack(swipedTrack);
          // Also update our in-memory set to trigger re-filtering
          dislikedIds.current.add(swipedTrack.id);
        } catch (e) {
          console.warn("Failed to save disliked track:", e);
        }
      }

      // Remove the swiped track from the raw list.
      // This will trigger the useMemo for visibleTracks to be recalculated.
      setRawTracks((prev) => prev.filter((track) => track.id !== swipedTrack.id));
    },
    [audioPlayer]
  );

  return {
    visibleTracks,
    handleSwipe,
    isFetching,
    fetchError,
    audioPlayer, // Exposing the whole player for more complex UI controls if needed
  };
}
