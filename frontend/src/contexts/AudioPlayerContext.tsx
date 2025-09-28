"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import {
  useAudioPlayer,
  AudioPlayerState,
  AudioPlayerActions,
} from "@/hooks/useAudioPlayer";
import { Track } from "@/services/types";
import { api } from "@/services";
import { useAuth } from "@/contexts/AuthContext";

// Define the shape of the context data
interface AudioPlayerContextType extends AudioPlayerState, AudioPlayerActions {
  playTrack: (track: Track) => Promise<void>;
}

// Create the context with a default undefined value
const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined
);

// Create a provider component
export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const audioPlayer = useAudioPlayer({
    onTrackEnd: () => {
      // This is where we could implement playlist logic, for now it loops by default in the hook
    },
  });
  const { isAuthenticated } = useAuth();

  const recordPlayback = useCallback(
    async (track: Track) => {
      if (!isAuthenticated) {
        return;
      }

      if (!track.preview_url) {
        return;
      }

      const trackId =
        typeof track.id === "number" ? track.id.toString() : track.id;
      if (
        !trackId ||
        trackId === "instruction-card" ||
        trackId.startsWith("swipe-")
      ) {
        return;
      }

      try {
        const payload = {
          source: "player",
          played_at: new Date().toISOString(),
          track: {
            external_id: trackId,
            title: track.title,
            artist: track.artist,
            album: track.album,
            artwork_url: track.artwork_url,
            preview_url: track.preview_url,
            primary_genre: track.genre,
            duration_ms: track.duration_ms,
          },
        };
        const response = await api.history.played(payload);
        if (response.error) {
          throw new Error(response.error.detail || response.error.error);
        }
      } catch (error) {
        console.warn("[AudioPlayer] Failed to record playback history", error);
      }
    },
    [isAuthenticated]
  );

  const basePlayTrack = audioPlayer.playTrack;

  const enhancedPlayTrack = useCallback(
    async (track: Track) => {
      await basePlayTrack(track);
      void recordPlayback(track);
    },
    [basePlayTrack, recordPlayback]
  );

  const contextValue = useMemo(() => {
    return {
      ...audioPlayer,
      playTrack: enhancedPlayTrack,
    };
  }, [audioPlayer, enhancedPlayTrack]);

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

// Create a custom hook for easy consumption of the context
export const useSharedAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error(
      "useSharedAudioPlayer must be used within an AudioPlayerProvider"
    );
  }
  return context;
};
