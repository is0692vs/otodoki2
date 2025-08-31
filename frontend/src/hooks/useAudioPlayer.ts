import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Track } from "@/services/types";

interface AudioPlayerState {
  nowPlayingTrackId: string | null;
  isMuted: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  canPlay: boolean;
}

interface AudioPlayerActions {
  playTrack: (track: Track) => Promise<void>;
  pause: () => void;
  stop: () => void;
  toggleMute: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
}

interface UseAudioPlayerOptions {
  autoPlay?: boolean;
  defaultMuted?: boolean;
  volume?: number;
  onTrackEnd?: () => void;
  onPlaybackError?: (error: string) => void;
  preloadNextCount?: number;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const {
    autoPlay = true,
    defaultMuted = true,
    volume = 0.7,
    preloadNextCount = 1,
    onTrackEnd,
    onPlaybackError,
  } = options;

  const opts = useMemo(
    () => ({
      autoPlay,
      defaultMuted,
      volume,
      preloadNextCount,
      onTrackEnd,
      onPlaybackError,
    }),
    [
      autoPlay,
      defaultMuted,
      volume,
      preloadNextCount,
      onTrackEnd,
      onPlaybackError,
    ]
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    nowPlayingTrackId: null,
    isMuted: opts.defaultMuted || false,
    isPlaying: false,
    isLoading: false,
    error: null,
    canPlay: false,
  });

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = state.isMuted ? 0 : opts.volume || 0.7;
    audio.muted = state.isMuted;

    // Audio event listeners
    const handleCanPlay = () => {
      setState((prev) => ({ ...prev, canPlay: true, isLoading: false }));
    };

    const handleLoadStart = () => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        canPlay: false,
        error: null,
      }));
    };

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      opts.onTrackEnd?.();
    };

    const handleError = () => {
      const error = "オーディオの再生に失敗しました";
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error,
        canPlay: false,
      }));
      opts.onPlaybackError?.(error);
    };

    const handleLoadedMetadata = () => {
      setState((prev) => ({ ...prev, isLoading: false }));
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);

      audio.pause();
      audio.src = "";
      audio.load();
    };
  }, [opts, state.isMuted]);

  // Update volume and mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = state.isMuted;
      audioRef.current.volume = state.isMuted ? 0 : opts.volume || 0.7;
    }
  }, [state.isMuted, opts.volume]);

  const playTrack = useCallback(
    async (track: Track): Promise<void> => {
      const audio = audioRef.current;
      if (!audio || !track.preview_url) {
        const error = track.preview_url
          ? "オーディオプレイヤーが初期化されていません"
          : "プレビューURLがありません";
        setState((prev) => ({ ...prev, error, nowPlayingTrackId: null }));
        return;
      }

      try {
        // Stop current playback
        audio.pause();
        audio.currentTime = 0;

        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          nowPlayingTrackId: track.id.toString(),
          canPlay: false,
        }));

        // Change source
        audio.src = track.preview_url;
        audio.load();

        // Try to play
        if (opts.autoPlay) {
          try {
            await audio.play();
          } catch {
            // If autoplay fails, try with muted audio
            if (!state.isMuted) {
              setState((prev) => ({ ...prev, isMuted: true }));
              audio.muted = true;
              try {
                await audio.play();
              } catch {
                const error =
                  "自動再生に失敗しました。再生ボタンをクリックしてください。";
                setState((prev) => ({
                  ...prev,
                  error,
                  isPlaying: false,
                  isLoading: false,
                }));
                opts.onPlaybackError?.(error);
              }
            } else {
              const error =
                "自動再生に失敗しました。再生ボタンをクリックしてください。";
              setState((prev) => ({
                ...prev,
                error,
                isPlaying: false,
                isLoading: false,
              }));
              opts.onPlaybackError?.(error);
            }
          }
        }
      } catch {
        const errorMessage = "トラックの読み込みに失敗しました";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isPlaying: false,
          isLoading: false,
          nowPlayingTrackId: null,
          canPlay: false,
        }));
        opts.onPlaybackError?.(errorMessage);
      }
    },
    [opts, state.isMuted]
  );

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        nowPlayingTrackId: null,
        error: null,
        canPlay: false,
      }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !state.nowPlayingTrackId) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      const errorMessage = "再生制御に失敗しました";
      setState((prev) => ({ ...prev, error: errorMessage }));
      opts.onPlaybackError?.(errorMessage);
    }
  }, [state.nowPlayingTrackId, opts]);

  const setVolume = useCallback(
    (volume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      if (audioRef.current && !state.isMuted) {
        audioRef.current.volume = clampedVolume;
      }
    },
    [state.isMuted]
  );

  // Preload next track
  const preloadTrack = useCallback(
    (track: Track) => {
      if (!track.preview_url || !opts.preloadNextCount) return;

      try {
        // Create or reuse preload audio element
        if (!preloadAudioRef.current) {
          preloadAudioRef.current = new Audio();
          preloadAudioRef.current.preload = "metadata";
        }

        const preloadAudio = preloadAudioRef.current;
        if (preloadAudio.src !== track.preview_url) {
          preloadAudio.src = track.preview_url;
          preloadAudio.load();
        }
      } catch {
        // Silently handle preload errors
        console.warn("Preload failed for track:", track.title);
      }
    },
    [opts]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (preloadAudioRef.current) {
        preloadAudioRef.current.pause();
        preloadAudioRef.current.src = "";
        preloadAudioRef.current.load();
      }
    };
  }, []);

  const actions: AudioPlayerActions = {
    playTrack,
    pause,
    stop,
    toggleMute,
    togglePlay,
    setVolume,
  };

  return {
    ...state,
    ...actions,
    preloadTrack,
  };
}

export type { AudioPlayerState, AudioPlayerActions, UseAudioPlayerOptions };
