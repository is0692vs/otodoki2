/**
 * Audio Player hook for React Native using Expo Audio
 * Adapted from frontend/src/hooks/useAudioPlayer.ts
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Track } from "../types/api";

interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  error: string | null;
  currentTrack: Track | null;
}

interface AudioPlayerActions {
  play: (track?: Track) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleMute: () => void;
  loadTrack: (track: Track) => Promise<void>;
}

interface UseAudioPlayerOptions {
  autoPlay?: boolean;
  defaultMuted?: boolean;
  volume?: number;
  isLooping?: boolean;
  onTrackEnd?: (track: Track) => void;
  onPlaybackError?: (error: string, track: Track) => void;
}

const PLAYBACK_RATE_KEY = "playback_rate";

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const {
    autoPlay = true,
    defaultMuted = false,
    volume = 0.7,
    isLooping = false,
    onTrackEnd,
    onPlaybackError,
  } = options;

  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume,
    playbackRate: 1,
    isMuted: defaultMuted,
    error: null,
    currentTrack: null,
  });

  const soundRef = useRef<Audio.Sound | null>(null);
  const onTrackEndRef = useRef(onTrackEnd);
  const onPlaybackErrorRef = useRef(onPlaybackError);

  // Track play retry attempts to handle transient buffering that toggles isPlaying
  // We retry a few times before giving up to make playback more robust on mobile
  const playRetriesRef = useRef<{
    attempts: number;
    timer?: ReturnType<typeof setTimeout>;
  }>({ attempts: 0 });

  // Token to ensure only the most recent load affects state
  const loadTokenRef = useRef<number>(0);
  // Timer for delayed unload when stop() is called to avoid racing with
  // immediate new loads (graceful stop)
  const unloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper: attempt to play with a few retries to survive transient buffering
  const attemptPlay = useCallback(async (token?: number) => {
    const MAX_ATTEMPTS = 3;
    const RETRY_MS = 400;

    // clear any existing retry timer first
    if (playRetriesRef.current.timer) {
      clearTimeout(playRetriesRef.current.timer);
      playRetriesRef.current.timer = undefined;
    }

    playRetriesRef.current.attempts = 0;

    const tryOnce = async () => {
      // If a token was provided and it no longer matches the active load, abort
      if (typeof token === "number" && token !== loadTokenRef.current) {
        console.log(
          "[useAudioPlayer] attemptPlay aborted due to stale token",
          token
        );
        return;
      }
      if (!soundRef.current) return;
      playRetriesRef.current.attempts += 1;
      const attempt = playRetriesRef.current.attempts;
      try {
        // Cancel any pending unload scheduled by a recent stop()
        if (unloadTimerRef.current) {
          clearTimeout(unloadTimerRef.current);
          unloadTimerRef.current = null;
        }
        console.log(`[useAudioPlayer] attemptPlay try #${attempt}`);
        await soundRef.current.playAsync();
        setState((prev) => ({ ...prev, isPlaying: true, error: null }));
      } catch (err) {
        console.warn(`[useAudioPlayer] attemptPlay failed #${attempt}:`, err);
      }

      // schedule check after a short delay to confirm isPlaying
      playRetriesRef.current.timer = setTimeout(async () => {
        playRetriesRef.current.timer = undefined;
        if (!soundRef.current) return;
        // If a token was provided and it no longer matches the active load, abort
        if (typeof token === "number" && token !== loadTokenRef.current) {
          console.log(
            "[useAudioPlayer] attemptPlay status check aborted due to stale token",
            token
          );
          return;
        }
        try {
          const status = await soundRef.current.getStatusAsync();
          console.log(
            `[useAudioPlayer] attemptPlay status after #${attempt}:`,
            { isPlaying: status.isPlaying, isLoaded: status.isLoaded }
          );
          if (status.isLoaded && status.isPlaying) {
            // success
            playRetriesRef.current.attempts = 0;
            return;
          }
          if (attempt < MAX_ATTEMPTS) {
            // retry
            tryOnce();
          } else {
            // give up
            setState((prev) => ({ ...prev, isPlaying: false }));
          }
        } catch (err) {
          console.warn(
            "[useAudioPlayer] attemptPlay status check failed:",
            err
          );
        }
      }, RETRY_MS);
    };

    tryOnce();
  }, []);

  // Update refs when props change
  useEffect(() => {
    onTrackEndRef.current = onTrackEnd;
  }, [onTrackEnd]);

  useEffect(() => {
    onPlaybackErrorRef.current = onPlaybackError;
  }, [onPlaybackError]);

  // Initialize audio mode
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Load saved playback rate
        const savedRate = await AsyncStorage.getItem(PLAYBACK_RATE_KEY);
        if (savedRate) {
          const rate = parseFloat(savedRate);
          if (rate >= 0.5 && rate <= 2.0) {
            setState((prev) => ({ ...prev, playbackRate: rate }));
          }
        }
      } catch (error) {
        console.warn("Failed to initialize audio:", error);
      }
    };

    initializeAudio();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Update position
  const updatePosition = useCallback(async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          setState((prev) => ({
            ...prev,
            currentTime: status.positionMillis || 0,
            duration: status.durationMillis || 0,
            isPlaying: status.isPlaying || false,
          }));

          // Check if track ended
          if (
            status.didJustFinish &&
            onTrackEndRef.current &&
            state.currentTrack
          ) {
            onTrackEndRef.current(state.currentTrack);
          }
        }
      } catch (error) {
        console.warn("Failed to get playback status:", error);
      }
    }
  }, []);

  // Set up position polling
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (state.isPlaying) {
      interval = setInterval(updatePosition, 500);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isPlaying, updatePosition]);

  // Load track
  const loadTrack = useCallback(
    async (track: Track, shouldPlayAfterLoad = false) => {
      // mark this load with a new token so earlier loads' callbacks are ignored
      const myToken = ++loadTokenRef.current;
      console.log(
        `[useAudioPlayer] loadTrack start id=${track.id} shouldPlay=${shouldPlayAfterLoad}`
      );
      if (!track.preview_url) {
        setState((prev) => ({
          ...prev,
          error: "No preview URL available",
          isLoading: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        // Capture reference to previous sound but do NOT unload it yet.
        // We'll only unload it after the new sound is confirmed ready to
        // avoid a race where unloading the previous sound interrupts
        // playback or causes transient state toggles.
        const previousSound = soundRef.current;

        // Clear any pending play retries
        if (playRetriesRef.current.timer) {
          clearTimeout(playRetriesRef.current.timer);
          playRetriesRef.current.timer = undefined;
          playRetriesRef.current.attempts = 0;
        }

        // Double-buffered load: create a new sound instance but do NOT start
        // playback immediately via createAsync. We'll control playback after
        // swapping the sound in to avoid overlapping actions.
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: track.preview_url },
          {
            shouldPlay: false,
            volume: state.isMuted ? 0 : state.volume,
            rate: state.playbackRate,
            shouldCorrectPitch: true,
            isLooping,
          }
        );
        console.log("[useAudioPlayer] createAsync completed, newSound created");

        // previousSound was captured above
        // Status callback for the new sound. It will swap into active use
        // only if its token matches (i.e., it's the most recent load), and
        // when it is loaded and (if requested) playing.
        let hasAttemptedPlay = false;
        newSound.setOnPlaybackStatusUpdate(async (status) => {
          try {
            if (myToken !== loadTokenRef.current) {
              // stale update from previous load; ignore
              return;
            }
            console.log("[useAudioPlayer] newSound statusUpdate:", {
              isLoaded: status.isLoaded,
              isPlaying: status.isPlaying,
              didJustFinish: status.didJustFinish,
              error: status.error,
            });

            if (status.isLoaded) {
              // At this point the newSound is loaded. Swap it in as the active
              // sound, then unload the previous sound to free resources.
              // Unload previous sound after we've confirmed newSound is active
              if (previousSound) {
                try {
                  await previousSound.unloadAsync();
                } catch (e) {
                  console.warn("Failed to unload previous sound:", e);
                }
              }

              // Set the new sound as active and update state
              soundRef.current = newSound;
              setState((prev) => ({
                ...prev,
                currentTrack: track,
                isLoading: false,
                error: null,
                isPlaying: status.isPlaying || false,
                currentTime: status.positionMillis || 0,
                duration: status.durationMillis || 0,
              }));

              // If playback was requested, start playback directly without retry
              // to match web version's simple approach
              if (shouldPlayAfterLoad && !hasAttemptedPlay) {
                hasAttemptedPlay = true;
                try {
                  await newSound.playAsync();
                  setState((prev) => ({ ...prev, isPlaying: true }));
                } catch (playError) {
                  console.warn("[useAudioPlayer] playAsync failed:", playError);
                  setState((prev) => ({ ...prev, isPlaying: false }));
                }
              }

              if (status.didJustFinish && onTrackEndRef.current) {
                console.log(
                  "[useAudioPlayer] didJustFinish triggering onTrackEnd"
                );
                onTrackEndRef.current(track);
              }
            } else if (status.error) {
              setState((prev) => ({
                ...prev,
                error: `Playback error: ${status.error}`,
                isLoading: false,
                isPlaying: false,
              }));
              if (onPlaybackErrorRef.current) {
                onPlaybackErrorRef.current(
                  `Playback error: ${status.error}`,
                  track
                );
              }
            } else {
              // Still buffering; update UI fields so the app knows we're loaded
              setState((prev) => ({
                ...prev,
                currentTime: status.positionMillis || 0,
                duration: status.durationMillis || 0,
                isPlaying: status.isPlaying || false,
                isLoading: true,
              }));
            }
          } catch (e) {
            console.warn("[useAudioPlayer] status callback error:", e);
          }
        });

        // No immediate outer attemptPlay here; playback is started from the
        // status callback after the swap to ensure the new sound is active
        // before attempting to play.
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load track";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          isPlaying: false,
        }));
        if (onPlaybackErrorRef.current) {
          onPlaybackErrorRef.current(errorMessage, track);
        }
      }
    },
    [state.volume, state.playbackRate, state.isMuted]
  );

  // Play
  const play = useCallback(
    async (track?: Track) => {
      if (track && track !== state.currentTrack) {
        // Load and start playback once loaded to avoid race conditions
        console.log(`[useAudioPlayer] play requested for id=${track.id}`);
        await loadTrack(track, true);
        return;
      }

      if (!soundRef.current) {
        return;
      }

      try {
        console.log("[useAudioPlayer] play requested for existing sound");
        // Use retrying play to be robust against brief buffering pauses
        await attemptPlay();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to play";
        console.warn("[useAudioPlayer] playAsync failed:", errorMessage);
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isPlaying: false,
        }));
      }
    },
    [state.currentTrack, loadTrack]
  );

  // Pause
  const pause = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        setState((prev) => ({ ...prev, isPlaying: false }));
      } catch (error) {
        console.warn("Failed to pause:", error);
      }
    }
  }, []);

  // Stop
  const stop = useCallback(async () => {
    console.log("[useAudioPlayer] stop() called (graceful)");
    // Invalidate any pending loads/retries so callbacks won't affect new loads
    loadTokenRef.current += 1;
    if (playRetriesRef.current.timer) {
      clearTimeout(playRetriesRef.current.timer);
      playRetriesRef.current.timer = undefined;
      playRetriesRef.current.attempts = 0;
    }

    // Pause immediately to stop audio output, then schedule an unload after
    // a short delay. If a new load starts before the delay expires, the
    // unload will be canceled.
    const UNLOAD_DELAY_MS = 500;

    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        setState((prev) => ({ ...prev, isPlaying: false }));
      } catch (error) {
        console.warn("Failed to pause during stop():", error);
      }

      // schedule unload
      if (unloadTimerRef.current) {
        clearTimeout(unloadTimerRef.current);
        unloadTimerRef.current = null;
      }
      unloadTimerRef.current = setTimeout(async () => {
        if (!soundRef.current) return;
        try {
          console.log("[useAudioPlayer] delayed unload executing");
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            currentTime: 0,
            currentTrack: null,
          }));
        } catch (error) {
          console.warn("Failed to unload during delayed stop:", error);
        } finally {
          if (unloadTimerRef.current) {
            clearTimeout(unloadTimerRef.current);
            unloadTimerRef.current = null;
          }
        }
      }, UNLOAD_DELAY_MS);
    }
  }, []);

  // Seek
  const seek = useCallback(async (position: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(position);
        setState((prev) => ({ ...prev, currentTime: position }));
      } catch (error) {
        console.warn("Failed to seek:", error);
      }
    }
  }, []);

  // Set volume
  const setVolume = useCallback(
    (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setState((prev) => ({ ...prev, volume: clampedVolume }));

      if (soundRef.current && !state.isMuted) {
        soundRef.current.setVolumeAsync(clampedVolume);
      }
    },
    [state.isMuted]
  );

  // Set playback rate
  const setPlaybackRate = useCallback(async (rate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2.0, rate));
    setState((prev) => ({ ...prev, playbackRate: clampedRate }));

    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(clampedRate, true);
        await AsyncStorage.setItem(PLAYBACK_RATE_KEY, clampedRate.toString());
      } catch (error) {
        console.warn("Failed to set playback rate:", error);
      }
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    const newMuted = !state.isMuted;
    setState((prev) => ({ ...prev, isMuted: newMuted }));

    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(newMuted ? 0 : state.volume);
      } catch (error) {
        console.warn("Failed to toggle mute:", error);
      }
    }
  }, [state.isMuted, state.volume]);

  const actions: AudioPlayerActions = {
    play,
    pause,
    stop,
    seek,
    setVolume,
    setPlaybackRate,
    toggleMute,
    loadTrack,
  };

  return [state, actions] as const;
}

export type { AudioPlayerState, AudioPlayerActions, UseAudioPlayerOptions };
