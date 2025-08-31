"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { Button } from "@/components/ui/button";
import {
  Heart,
  X,
  RotateCcw,
  Play,
  Pause,
  VolumeX,
  Volume2,
} from "lucide-react";
import { type Track } from "@/services";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useVisibility, usePageVisibility } from "@/hooks/useVisibility";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export interface SwipeStackProps {
  tracks: Track[];
  onSwipe?: (direction: "left" | "right", track: Track) => void;
  onStackEmpty?: () => void;
  className?: string;
}

export function SwipeStack({
  tracks,
  onSwipe,
  onStackEmpty,
  className,
}: SwipeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedTracks, setSwipedTracks] = useState<Track[]>([]);

  const currentTrack = tracks[currentIndex];
  const nextTracks = tracks.slice(currentIndex + 1, currentIndex + 3); // Show next 2 cards behind

  // Audio player hook with stable options
  const audioPlayer = useAudioPlayer({
    autoPlay: true,
    defaultMuted: false, // Start unmuted, will auto-mute if needed
    volume: 0.7,
    onTrackEnd: useCallback(() => {
      // Optionally auto-advance to next track
    }, []),
    onPlaybackError: useCallback((error: string) => {
      // Handle error silently or show user-friendly message
      console.warn("Audio error:", error);
    }, []),
  });

  // Visibility monitoring
  const { ref: stackRef, isVisible: isStackVisible } = useVisibility({
    onVisibilityChange: (visible) => {
      if (!visible && audioPlayer.isPlaying) {
        audioPlayer.pause();
      }
    },
    threshold: 0.5,
  });

  const isPageVisible = usePageVisibility();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSpacePress: () => {
      if (currentTrack) {
        if (
          audioPlayer.error &&
          !audioPlayer.isPlaying &&
          currentTrack.preview_url
        ) {
          // Retry playing if there was an auto-play error
          audioPlayer.playTrack(currentTrack);
        } else {
          audioPlayer.togglePlay();
        }
      }
    },
    onArrowLeft: () => handleButtonSwipe("left"),
    onArrowRight: () => handleButtonSwipe("right"),
  });

  // Auto-play current track when it changes
  useEffect(() => {
    const currentTrack = tracks[currentIndex];
    const nextTrack = tracks[currentIndex + 1];

    if (currentTrack && isStackVisible && isPageVisible) {
      audioPlayer.playTrack(currentTrack);

      // Preload next track
      if (nextTrack) {
        audioPlayer.preloadTrack(nextTrack);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isStackVisible, isPageVisible]);

  // Pause on page visibility change
  useEffect(() => {
    if (!isPageVisible && audioPlayer.isPlaying) {
      audioPlayer.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPageVisible]);

  const handleSwipe = (direction: "left" | "right", track: Track) => {
    // Stop current playback before moving to next
    audioPlayer.stop();

    // Add swiped track to history
    setSwipedTracks((prev) => [...prev, track]);
    
    // Update current index with a slight delay to ensure smooth animation
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= tracks.length) {
          onStackEmpty?.();
          return 0; // Reset to beginning
        }
        return next;
      });
    }, 100); // Small delay for smooth transition
    
    onSwipe?.(direction, track);
  };

  const handleButtonSwipe = (direction: "left" | "right") => {
    if (currentTrack) {
      // If there's an auto-play error, try to play after user interaction
      if (
        audioPlayer.error &&
        !audioPlayer.isPlaying &&
        currentTrack.preview_url
      ) {
        audioPlayer.playTrack(currentTrack);
      }
      handleSwipe(direction, currentTrack);
    }
  };

  const handleReset = () => {
    audioPlayer.stop();
    setCurrentIndex(0);
    setSwipedTracks([]);
  };

  if (!currentTrack) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">
          すべての楽曲をスワイプしました！
        </p>
        <Button onClick={handleReset} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          リセット
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Audio Controls */}
      <div className="flex justify-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (audioPlayer.error && currentTrack && !audioPlayer.isPlaying) {
              // Retry playing the current track if there was an error
              audioPlayer.playTrack(currentTrack);
            } else {
              audioPlayer.togglePlay();
            }
          }}
          disabled={
            !audioPlayer.canPlay && !audioPlayer.isPlaying && !audioPlayer.error
          }
          className="gap-2"
          aria-label={audioPlayer.isPlaying ? "一時停止" : "再生"}
        >
          {audioPlayer.isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {audioPlayer.isPlaying ? "一時停止" : "再生"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={audioPlayer.toggleMute}
          className="gap-2"
          aria-label={audioPlayer.isMuted ? "ミュート解除" : "ミュート"}
        >
          {audioPlayer.isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {audioPlayer.isMuted ? "ミュート" : "音声"}
        </Button>
      </div>

      {/* Current track info and loading state */}
      <div className="text-center mb-4">
        <h2 className="font-semibold text-lg truncate">{currentTrack.title}</h2>
        <p className="text-muted-foreground truncate">{currentTrack.artist}</p>
        {audioPlayer.isLoading && (
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        )}
        {audioPlayer.error && (
          <p className="text-sm text-amber-600">{audioPlayer.error}</p>
        )}
        {!currentTrack.preview_url && (
          <p className="text-sm text-muted-foreground">プレビュー利用不可</p>
        )}
      </div>

      {/* Stack Container */}
      <div
        ref={stackRef}
        className="relative h-[500px] w-full max-w-sm mx-auto"
      >
        {/* Background cards */}
        {nextTracks.map((track, index) => (
          <div
            key={track.id}
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: nextTracks.length - index,
              transform: `scale(${0.95 - index * 0.05}) translateY(${
                (index + 1) * 10
              }px)`,
            }}
          >
            <SwipeCard
              track={track}
              isTop={false}
              className="pointer-events-none"
            />
          </div>
        ))}

        {/* Current card */}
        <AnimatePresence mode="sync">
          <SwipeCard
            key={currentTrack.id}
            track={currentTrack}
            onSwipe={handleSwipe}
            isTop={true}
            isPlaying={
              audioPlayer.isPlaying &&
              audioPlayer.nowPlayingTrackId === currentTrack.id.toString()
            }
          />
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleButtonSwipe("left")}
          className="h-14 w-14 rounded-full border-red-200 hover:bg-red-50 hover:border-red-300"
          aria-label="嫌い"
        >
          <X className="h-6 w-6 text-red-500" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => handleButtonSwipe("right")}
          className="h-14 w-14 rounded-full border-green-200 hover:bg-green-50 hover:border-green-300"
          aria-label="好き"
        >
          <Heart className="h-6 w-6 text-green-500" />
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} / {tracks.length}
        </p>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / tracks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Reset button */}
      {swipedTracks.length > 0 && (
        <div className="mt-4 text-center">
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            リセット
          </Button>
        </div>
      )}
    </div>
  );
}
