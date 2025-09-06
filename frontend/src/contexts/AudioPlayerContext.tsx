"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioPlayer, AudioPlayerState, AudioPlayerActions } from '@/hooks/useAudioPlayer';
import { Track } from '@/services/types';

// Define the shape of the context data
interface AudioPlayerContextType extends AudioPlayerState, AudioPlayerActions {
  playTrack: (track: Track) => Promise<void>;
}

// Create the context with a default undefined value
const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

// Create a provider component
export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const audioPlayer = useAudioPlayer({
    onTrackEnd: () => {
      // This is where we could implement playlist logic, for now it loops by default in the hook
    },
  });

  return (
    <AudioPlayerContext.Provider value={audioPlayer}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

// Create a custom hook for easy consumption of the context
export const useSharedAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useSharedAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
