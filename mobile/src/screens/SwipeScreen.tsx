/**
 * Swipe screen for evaluating tracks
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  AppState,
  AppStateStatus,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api-client";
import { Track, EvaluationStatus } from "../types/api";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import TrackCard from "../components/TrackCard";
import LoadingScreen from "./LoadingScreen";

export default function SwipeScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const cardWidth = screenWidth * 0.8;
  const cardHeight = screenHeight * 0.6;
  const SWIPE_THRESHOLD = screenWidth * 0.15;

  // Instruction card for first-time users
  const instructionCard: Track = {
    id: "instruction",
    title: "使い方",
    artist: "otodoki2",
    album: "左右にスワイプするか、下のボタンで評価を始めましょう",
  };
  const [tracks, setTracks] = useState<Track[]>([instructionCard]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [noMoreTracks, setNoMoreTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const evaluatedTrackIdsRef = useRef<Set<string>>(new Set());

  const [audioState, audioActions] = useAudioPlayer({
    autoPlay: false,
    isLooping: true,
    onPlaybackError: (error, track) => {
      console.warn("Playback error:", error, track);
    },
  });
  const audioStateRef = useRef(audioState);
  const audioActionsRef = useRef(audioActions);
  useEffect(() => {
    audioStateRef.current = audioState;
    audioActionsRef.current = audioActions;
  });

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        audioActions.pause();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [audioActions]);

  // Handle navigation focus
  useFocusEffect(
    useCallback(() => {
      // Resume playback when screen comes into focus
      return () => {
        // Pause when screen loses focus
        if (audioState.isPlaying) {
          audioActions.pause();
        }
      };
    }, [audioActions, audioState.isPlaying])
  );

  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
      rotate.setValue((gesture.dx / screenWidth) * 0.4);
    },
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) > SWIPE_THRESHOLD) {
        const direction = gesture.dx > 0 ? "right" : "left";
        forceSwipe(direction);
      } else {
        resetPosition();
      }
    },
  });

  const forceSwipe = (direction: "left" | "right") => {
    const x = direction === "right" ? screenWidth : -screenWidth;
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onSwipeComplete(direction));
  };

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onSwipeComplete = async (direction: "left" | "right") => {
    const currentTrack = tracks[currentIndex];

    if (currentTrack && currentTrack.id !== "instruction") {
      const status: EvaluationStatus =
        direction === "right" ? "like" : "dislike";

      // Add to evaluated tracks
      evaluatedTrackIdsRef.current.add(String(currentTrack.id));

      if (isAuthenticated) {
        try {
          await api.evaluations.create({
            track: {
              external_id: String(currentTrack.id),
              title: currentTrack.title,
              artist: currentTrack.artist,
              album: currentTrack.album,
              artwork_url: currentTrack.artwork_url,
              preview_url: currentTrack.preview_url,
              primary_genre: currentTrack.genre,
              duration_ms: currentTrack.duration_ms,
            },
            status,
            source: "mobile_swipe",
          });
        } catch (error) {
          console.warn("Failed to save evaluation:", error);
        }
      }
    }

    // Move to next track
    Animated.timing(position, {
      toValue: { x: 0, y: 0 },
      duration: 0,
      useNativeDriver: true,
    }).start();

    Animated.timing(rotate, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    }).start();

    Animated.timing(opacity, {
      toValue: 1,
      duration: 0,
      useNativeDriver: true,
    }).start();

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    // Fetch more tracks if needed
    if (nextIndex >= tracks.length - 3 && !isFetchingMore && !noMoreTracks) {
      fetchMoreTracks();
    }
  };

  // Fetch initial tracks
  const fetchInitialTracks = useCallback(async () => {
    setLoading(true);
    setNoMoreTracks(false);
    setError(null);

    try {
      const response = await api.tracks.suggestions({
        limit: 20,
        excludeIds: Array.from(evaluatedTrackIdsRef.current).join(","),
      });

      if (response.error) {
        throw new Error(response.error.error);
      }

      const apiTracks = response.data?.data || [];
      const filteredApiTracks = apiTracks.filter((track) => {
        const trackId = String(track.id);
        return !evaluatedTrackIdsRef.current.has(trackId);
      });

      console.log(`📱 Loaded ${filteredApiTracks.length} initial tracks.`);
      setTracks([instructionCard, ...filteredApiTracks]);

      // Reset to first track (instruction card)
      setCurrentIndex(0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error loading tracks: ${errorMessage}`);
      // Use instruction card as fallback
      setTracks([instructionCard]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch more tracks
  const fetchMoreTracks = useCallback(async () => {
    if (isFetchingMore || noMoreTracks || loading) return;

    setIsFetchingMore(true);
    console.log("[FETCH] Starting to fetch more tracks...");

    try {
      const existingIds = new Set(
        tracks.map((t) => t.id).filter((id) => !isNaN(Number(id)))
      );
      const excludeIds = Array.from(
        new Set([
          ...evaluatedTrackIdsRef.current,
          ...Array.from(existingIds).map((id) => String(id)),
        ])
      ).join(",");

      const response = await api.tracks.suggestions({ limit: 10, excludeIds });

      if (response.error) {
        throw new Error(response.error.error);
      }

      const newApiTracks = response.data?.data || [];

      if (newApiTracks.length === 0) {
        console.log("[FETCH] No more tracks returned from API.");
        setNoMoreTracks(true);
        return;
      }

      const filteredNewTracks = newApiTracks.filter((track) => {
        const trackId = String(track.id);
        return !evaluatedTrackIdsRef.current.has(trackId);
      });

      console.log(`[FETCH] Added ${filteredNewTracks.length} new tracks.`);
      setTracks((prev) => [...prev, ...filteredNewTracks]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[FETCH] Error fetching more tracks:", errorMessage);
      setNoMoreTracks(true);
    } finally {
      setIsFetchingMore(false);
    }
  }, [tracks, isFetchingMore, noMoreTracks, loading]);

  // Load evaluated tracks on mount
  const syncEvaluatedTracks = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const pageSize = 100;
      let offset = 0;
      const nextSet = new Set<string>();

      while (true) {
        const response = await api.evaluations.list({
          limit: pageSize,
          offset,
        });

        if (response.error) {
          console.warn("Failed to load evaluations", response.error);
          break;
        }

        const items = response.data?.items ?? [];
        items.forEach((item) => {
          nextSet.add(item.external_track_id);
        });

        if (items.length < pageSize) {
          break;
        }
        offset += pageSize;
      }

      console.log(`📱 Loaded ${nextSet.size} evaluated track IDs.`);
      evaluatedTrackIdsRef.current = nextSet;
    } catch (error) {
      console.warn("Failed to sync evaluated tracks:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    syncEvaluatedTracks().then(() => {
      fetchInitialTracks();
    });
  }, [syncEvaluatedTracks, fetchInitialTracks]);

  // Auto-play current track when index changes
  useEffect(() => {
    const currentTrack = tracks[currentIndex];
    const isPlayable =
      currentTrack &&
      currentTrack.id !== "instruction" &&
      currentTrack.preview_url;

    if (isPlayable) {
      const { currentTrack: currentAudioTrack, isPlaying } =
        audioStateRef.current;
      const isSameTrackPlaying =
        currentAudioTrack?.id === currentTrack.id && isPlaying;

      if (!isSameTrackPlaying) {
        console.log(
          `[SwipeScreen] Auto-play check: track=${currentTrack.id}, isPlaying=${isPlaying}, currentTrack=${currentAudioTrack?.id}`
        );
        audioActionsRef.current.play(currentTrack);
      }
    } else {
      // If not playable (e.g., instruction card), ensure audio is paused
      if (audioStateRef.current.isPlaying) {
        console.log(
          `[SwipeScreen] Pausing audio for non-playable track: ${
            currentTrack?.id || "N/A"
          }`
        );
        audioActionsRef.current.pause();
      }
    }
  }, [currentIndex, tracks]);

  // Handle play/pause
  const handlePlayToggle = () => {
    const currentTrack = tracks[currentIndex];
    if (!currentTrack || currentTrack.id === "instruction") return;

    if (
      audioState.isPlaying &&
      audioState.currentTrack?.id === currentTrack.id
    ) {
      audioActions.pause();
    } else {
      audioActions.play(currentTrack);
    }
  };

  // Manual swipe buttons
  const handleLike = () => {
    forceSwipe("right");
  };

  const handleDislike = () => {
    forceSwipe("left");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (currentIndex >= tracks.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.endContainer}>
          <Text style={styles.endTitle}>お疲れさまでした！</Text>
          <Text style={styles.endSubtitle}>
            新しい楽曲が追加されるまでお待ちください
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchInitialTracks}
          >
            <Text style={styles.refreshButtonText}>リフレッシュ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentTrack = tracks[currentIndex];
  const isCurrentPlaying =
    audioState.isPlaying && audioState.currentTrack?.id === currentTrack.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>otodoki2</Text>
        <Text style={styles.headerSubtitle}>
          {currentIndex + 1} / {tracks.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        {/* Render next cards in background */}
        {tracks
          .slice(currentIndex + 1, currentIndex + 3)
          .map((track, index) => (
            <View
              key={track.id}
              style={[
                {
                  zIndex: -index - 1,
                  transform: [
                    { scale: 0.95 - index * 0.02 },
                    { translateY: (index + 1) * 8 },
                  ],
                  opacity: 0.8 - index * 0.2,
                  position: "absolute",
                  width: cardWidth,
                  height: cardHeight,
                  left: (screenWidth - cardWidth) / 2,
                },
              ]}
            >
              <TrackCard
                track={track}
                onPlayToggle={() => {}}
                isPlaying={false}
                isLoading={false}
              />
            </View>
          ))}

        {/* Current card on top */}
        <Animated.View
          style={[
            {
              zIndex: 10,
              transform: [
                {
                  rotate: rotate.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: ["-30deg", "0deg", "30deg"],
                  }),
                },
                ...position.getTranslateTransform(),
              ],
              opacity: opacity,
              position: "absolute",
              width: cardWidth,
              height: cardHeight,
              left: (screenWidth - cardWidth) / 2,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TrackCard
            track={currentTrack}
            onPlayToggle={handlePlayToggle}
            isPlaying={isCurrentPlaying}
            isLoading={audioState.isLoading}
          />
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.dislikeButton]}
          onPress={handleDislike}
        >
          <Text style={styles.controlButtonText}>✗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.likeButton]}
          onPress={handleLike}
        >
          <Text style={styles.controlButtonText}>♥</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 30,
    paddingHorizontal: 50,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dislikeButton: {
    backgroundColor: "#ef4444",
  },
  likeButton: {
    backgroundColor: "#22c55e",
  },
  controlButtonText: {
    fontSize: 36,
  },
  endContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  endTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  endSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    color: "#ff4757",
    textAlign: "center",
    fontSize: 14,
  },
});
