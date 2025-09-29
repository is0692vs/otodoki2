/**
 * Audio Player hook for React Native using Expo Audio
 * Adapted from frontend/src/hooks/useAudioPlayer.ts
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  loadTrack: (track: Track, shouldPlay?: boolean) => Promise<void>;
}

interface UseAudioPlayerOptions {
  defaultMuted?: boolean;
  volume?: number;
  isLooping?: boolean;
  onTrackEnd?: (track: Track) => void;
  onPlaybackError?: (error: string, track: Track) => void;
}

const PLAYBACK_RATE_KEY = "playback_rate";

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const {
    defaultMuted = false,
    volume = 0.7,
    isLooping = false,
    onTrackEnd,
    onPlaybackError,
  } = options;

  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: true, // Start with loading true until audio is configured
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

  // Update callback refs
  useEffect(() => {
    onTrackEndRef.current = onTrackEnd;
  }, [onTrackEnd]);

  useEffect(() => {
    onPlaybackErrorRef.current = onPlaybackError;
  }, [onPlaybackError]);

  // Initialize audio mode and load saved settings
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

        const savedRate = await AsyncStorage.getItem(PLAYBACK_RATE_KEY);
        if (savedRate) {
          const rate = parseFloat(savedRate);
          if (rate >= 0.5 && rate <= 2.0) {
            setState((prev) => ({ ...prev, playbackRate: rate }));
          }
        }
      } catch (error) {
        console.warn("Failed to initialize audio:", error);
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAudio();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Main track loading logic
  const loadTrack = useCallback(
    async (track: Track, shouldPlayAfterLoad = false) => {
      if (!track.preview_url) {
        setState((prev) => ({
          ...prev,
          error: "No preview URL available",
          isLoading: false,
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: track.preview_url },
          {
            shouldPlay: shouldPlayAfterLoad,
            volume: state.volume,
            rate: state.playbackRate,
            isMuted: state.isMuted,
            isLooping,
          }
        );
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) {
            if (status.error) {
              const errorMessage = `Playback error: ${status.error}`;
              setState((prev) => ({
                ...prev,
                error: errorMessage,
                isLoading: false,
                isPlaying: false,
              }));
              onPlaybackErrorRef.current?.(errorMessage, track);
            }
            return;
          }

          setState((prev) => ({
            ...prev,
            currentTime: status.positionMillis,
            duration: status.durationMillis || 0,
            isPlaying: status.isPlaying,
            isLoading: false,
          }));

          if (status.didJustFinish) {
            onTrackEndRef.current?.(track);
          }
        });

        setState((prev) => ({
          ...prev,
          currentTrack: track,
          duration: status.isLoaded ? status.durationMillis || 0 : 0,
          isPlaying: shouldPlayAfterLoad,
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load track";
        console.warn(`[useAudioPlayer] ${errorMessage}`);
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          isPlaying: false,
        }));
        onPlaybackErrorRef.current?.(errorMessage, track);
      }
    },
    [isLooping, state.isMuted, state.playbackRate, state.volume]
  );

  const play = useCallback(
    async (track?: Track) => {
      if (track && track.id !== state.currentTrack?.id) {
        console.log(`[Player] Playing: ${track.title} (${track.id})`);
        await loadTrack(track, true);
        return;
      }

      if (soundRef.current) {
        try {
          await soundRef.current.playAsync();
          setState((prev) => ({ ...prev, isPlaying: true }));
        } catch (error) {
          console.warn("[useAudioPlayer] playAsync failed:", error);
        }
      }
    },
    [loadTrack, state.currentTrack]
  );

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

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
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
        console.warn("Failed to stop:", error);
      }
    }
  }, []);

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

  const setVolume = useCallback(
    (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setState((prev) => ({ ...prev, volume: clampedVolume, isMuted: false }));
      soundRef.current?.setVolumeAsync(clampedVolume);
    },
    []
  );

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

  const toggleMute = useCallback(async () => {
    const newMuted = !state.isMuted;
    setState((prev) => ({ ...prev, isMuted: newMuted }));
    soundRef.current?.setIsMutedAsync(newMuted);
  }, [state.isMuted]);

  const actions: AudioPlayerActions = useMemo(
    () => ({
      play,
      pause,
      stop,
      seek,
      setVolume,
      setPlaybackRate,
      toggleMute,
      loadTrack,
    }),
    [
      play,
      pause,
      stop,
      seek,
      setVolume,
      setPlaybackRate,
      toggleMute,
      loadTrack,
    ]
  );

  return [state, actions] as const;
}

export type { AudioPlayerState, AudioPlayerActions, UseAudioPlayerOptions };