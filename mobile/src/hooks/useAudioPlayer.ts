/**
 * Audio Player hook for React Native using Expo AV
 * Adapted from frontend/src/hooks/useAudioPlayer.ts
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from '../types/api';

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
  onTrackEnd?: (track: Track) => void;
  onPlaybackError?: (error: string, track: Track) => void;
}

const PLAYBACK_RATE_KEY = 'playback_rate';

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const {
    autoPlay = true,
    defaultMuted = false,
    volume = 0.7,
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
            setState(prev => ({ ...prev, playbackRate: rate }));
          }
        }
      } catch (error) {
        console.warn('Failed to initialize audio:', error);
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
          setState(prev => ({
            ...prev,
            currentTime: status.positionMillis || 0,
            duration: status.durationMillis || 0,
            isPlaying: status.isPlaying || false,
          }));

          // Check if track ended
          if (status.didJustFinish && onTrackEndRef.current && state.currentTrack) {
            onTrackEndRef.current(state.currentTrack);
          }
        }
      } catch (error) {
        console.warn('Failed to get playback status:', error);
      }
    }
  }, []);

  // Set up position polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
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
  const loadTrack = useCallback(async (track: Track) => {
    if (!track.preview_url) {
      setState(prev => ({
        ...prev,
        error: 'No preview URL available',
        isLoading: false,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.preview_url },
        {
          shouldPlay: false,
          volume: state.isMuted ? 0 : state.volume,
          rate: state.playbackRate,
          shouldCorrectPitch: true,
        }
      );

      soundRef.current = sound;

      // Set up status update callback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setState(prev => ({
            ...prev,
            currentTime: status.positionMillis || 0,
            duration: status.durationMillis || 0,
            isPlaying: status.isPlaying || false,
            isLoading: false,
          }));

          if (status.didJustFinish && onTrackEndRef.current) {
            onTrackEndRef.current(track);
          }
        } else if (status.error) {
          setState(prev => ({
            ...prev,
            error: `Playback error: ${status.error}`,
            isLoading: false,
            isPlaying: false,
          }));
          if (onPlaybackErrorRef.current) {
            onPlaybackErrorRef.current(`Playback error: ${status.error}`, track);
          }
        }
      });

      setState(prev => ({
        ...prev,
        currentTrack: track,
        isLoading: false,
        error: null,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load track';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        isPlaying: false,
      }));
      if (onPlaybackErrorRef.current) {
        onPlaybackErrorRef.current(errorMessage, track);
      }
    }
  }, [state.volume, state.playbackRate, state.isMuted]);

  // Play
  const play = useCallback(async (track?: Track) => {
    if (track && track !== state.currentTrack) {
      await loadTrack(track);
    }

    if (!soundRef.current) {
      return;
    }

    try {
      await soundRef.current.playAsync();
      setState(prev => ({ ...prev, isPlaying: true, error: null }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isPlaying: false,
      }));
    }
  }, [state.currentTrack, loadTrack]);

  // Pause
  const pause = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        setState(prev => ({ ...prev, isPlaying: false }));
      } catch (error) {
        console.warn('Failed to pause:', error);
      }
    }
  }, []);

  // Stop
  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        setState(prev => ({
          ...prev,
          isPlaying: false,
          currentTime: 0,
        }));
      } catch (error) {
        console.warn('Failed to stop:', error);
      }
    }
  }, []);

  // Seek
  const seek = useCallback(async (position: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(position);
        setState(prev => ({ ...prev, currentTime: position }));
      } catch (error) {
        console.warn('Failed to seek:', error);
      }
    }
  }, []);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setState(prev => ({ ...prev, volume: clampedVolume }));
    
    if (soundRef.current && !state.isMuted) {
      soundRef.current.setVolumeAsync(clampedVolume);
    }
  }, [state.isMuted]);

  // Set playback rate
  const setPlaybackRate = useCallback(async (rate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2.0, rate));
    setState(prev => ({ ...prev, playbackRate: clampedRate }));
    
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(clampedRate, true);
        await AsyncStorage.setItem(PLAYBACK_RATE_KEY, clampedRate.toString());
      } catch (error) {
        console.warn('Failed to set playback rate:', error);
      }
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    const newMuted = !state.isMuted;
    setState(prev => ({ ...prev, isMuted: newMuted }));
    
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(newMuted ? 0 : state.volume);
      } catch (error) {
        console.warn('Failed to toggle mute:', error);
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