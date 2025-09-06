"use client";

import React from 'react';
import { TrackCard, TrackCardProps } from './TrackCard';
import { useSharedAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Track } from '@/services/types';

interface PlayableTrackCardProps {
  track: Track;
  className?: string;
}

export function PlayableTrackCard({ track, className }: PlayableTrackCardProps) {
  const {
    nowPlayingTrackId,
    isPlaying,
    isLoading,
    error,
    playTrack,
    togglePlay,
  } = useSharedAudioPlayer();

  const isThisCardPlaying = nowPlayingTrackId === track.id.toString();
  const isThisCardLoading = isLoading && nowPlayingTrackId === track.id.toString();

  const handlePlayToggle = () => {
    if (isThisCardPlaying) {
      togglePlay();
    } else {
      if (track.preview_url) {
        playTrack(track);
      }
    }
  };

  return (
    <TrackCard
      track={track}
      className={className}
      showAudioControls={true}
      isPlaying={isThisCardPlaying && isPlaying}
      isLoading={isThisCardLoading}
      canPlay={!!track.preview_url}
      onPlayToggle={handlePlayToggle}
      error={isThisCardPlaying ? error : null}
    />
  );
}
