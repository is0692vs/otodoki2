"use client";

import React, { useEffect, useRef } from "react";
import { TrackCard } from "./TrackCard";
import { useSharedAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Track } from "@/services/types";

interface PlayableTrackCardProps {
  track: Track;
  className?: string;
}

export function PlayableTrackCard({
  track,
  className,
}: PlayableTrackCardProps) {
  const {
    nowPlayingTrackId,
    isPlaying,
    isLoading,
    error,
    playTrack,
    togglePlay,
    stop,
  } = useSharedAudioPlayer();

  const isThisCardPlaying = nowPlayingTrackId === track.id.toString();
  const isThisCardLoading =
    isLoading && nowPlayingTrackId === track.id.toString();

  // Use a ref to track if this card is playing. This avoids stale closures
  // in the useEffect cleanup function.
  const isPlayingRef = useRef(isThisCardPlaying);
  isPlayingRef.current = isThisCardPlaying;

  const handlePlayToggle = () => {
    if (isThisCardPlaying) {
      togglePlay();
    } else {
      if (track.preview_url) {
        playTrack(track);
      }
    }
  };

  useEffect(() => {
    // Return a cleanup function that will be called only on unmount.
    return () => {
      // If this card was the one playing when it unmounted, stop playback.
      if (isPlayingRef.current) {
        stop();
      }
    };
  }, [stop]); // `stop` is stable, so this effect runs only on mount/unmount.

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
