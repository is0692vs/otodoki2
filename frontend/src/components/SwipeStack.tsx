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
import { REFILL_THRESHOLD } from "@/lib/constants";

export interface SwipeStackProps {
  tracks: Track[];
  onSwipe?: (direction: "left" | "right", track: Track) => void;
  onLowOnTracks?: () => void;
  onStackEmpty?: () => void; // Kept for now, but will be deprecated by new logic
  className?: string;
  noMoreTracks?: boolean;
}

export function SwipeStack({
  tracks,
  onSwipe,
  onLowOnTracks,
  onStackEmpty,
  className,
  noMoreTracks,
}: SwipeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedTracks, setSwipedTracks] = useState<Track[]>([]);

  const currentTrack = tracks[currentIndex];
  const isInstructionCard = currentTrack?.id === "instruction-card";

  const audioPlayer = useAudioPlayer({
    autoPlay: !isInstructionCard,
    defaultMuted: false,
    volume: 0.7,
    onTrackEnd: useCallback(() => {
      // Note: We can't easily reference audioPlayerHook here before it's initialized.
      // This logic is now handled by the playTrack effect.
      // A more robust solution might involve passing a function that receives the player instance.
    }, []),
    onPlaybackError: useCallback((error: string) => {
      console.warn("Audio error:", error);
    }, []),
  });


  // By destructuring, we can ensure our effects only re-run when the specific props/functions we use change.
  const {
    playTrack,
    preloadTrack,
    pause,
    stop,
    togglePlay,
    toggleMute,
    isPlaying,
    isMuted,
    canPlay,
    isLoading,
    error: audioError,
    nowPlayingTrackId,
  } = audioPlayer;


  const { ref: stackRef, isVisible: isStackVisible } = useVisibility({
    onVisibilityChange: (visible) => {
      if (!visible && isPlaying) {
        pause();
      }
    },
    threshold: 0.5,
  });

  const isPageVisible = usePageVisibility();

  useKeyboardShortcuts({
    onSpacePress: () => {
      if (currentTrack && !isInstructionCard) {
        togglePlay();
      }
    },
    onArrowLeft: () => handleButtonSwipe("left"),
    onArrowRight: () => handleButtonSwipe("right"),
  });

  useEffect(() => {
    if (currentTrack && !isInstructionCard && isStackVisible && isPageVisible) {
      playTrack(currentTrack);
      const nextTrack = tracks[currentIndex + 1];
      if (nextTrack) {
        preloadTrack(nextTrack);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isStackVisible, isPageVisible, tracks, currentTrack, isInstructionCard, playTrack, preloadTrack]);

  useEffect(() => {
    if (!isPageVisible && isPlaying) {
      pause();
    }
  }, [isPageVisible, isPlaying, pause]);

  const handleSwipe = (direction: "left" | "right", track: Track) => {
    if (!isInstructionCard) {
      stop();
    }
    onSwipe?.(direction, track);
    setSwipedTracks((prev) => [...prev, track]);

    if (track.id !== "instruction-card") {
      const newIndex = currentIndex + 1;
      console.log(`[QUEUE] Swiped to track ${newIndex} / ${tracks.length}`);
      setCurrentIndex(newIndex);
      // Check if we need to fetch more tracks
      if (onLowOnTracks && tracks.length - newIndex <= REFILL_THRESHOLD) {
        console.log(`[SwipeStack] Low on tracks (remaining: ${tracks.length - newIndex}), requesting more.`);
        onLowOnTracks();
      }
    }
  };

  const handleButtonSwipe = (direction: "left" | "right") => {
    if (currentTrack) {
      handleSwipe(direction, currentTrack);
    }
  };

  const onExitComplete = () => {
    // This is called after the card disappears.
    // We check if the queue is now empty and if there are no more tracks to be fetched.
    if (currentIndex >= tracks.length && tracks.length > 0 && noMoreTracks) {
      onStackEmpty?.(); // Signal that the stack is truly and finally empty.
    }
  };

  const handleReset = () => {
    stop();
    // This should ideally be handled by the parent component by re-fetching
    // and passing a new `tracks` array. For now, we just reset the index.
    setCurrentIndex(0);
    setSwipedTracks([]);
    // Let parent know we want a reset
    if (onStackEmpty) {
      onStackEmpty();
    }
  };

  if (!currentTrack) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">すべての楽曲をスワイプしました！</p>
        <Button onClick={handleReset} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          もう一度探す
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {!isInstructionCard && (
        <>
          <div className="flex justify-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
              disabled={!canPlay && !isPlaying}
              className="gap-2"
            >
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMute}
              className="gap-2"
            >
              {isMuted ? <VolumeX /> : <Volume2 />}
            </Button>
          </div>
          <div className="text-center mb-4">
            {isLoading && <p>Loading...</p>}
            {audioError && <p className="text-red-500">{audioError}</p>}
            {!currentTrack.preview_url && <p>Preview not available</p>}
          </div>
        </>
      )}

      <div ref={stackRef} className="relative h-[500px] w-full max-w-sm mx-auto">
        <AnimatePresence onExitComplete={onExitComplete}>
          {tracks.slice(currentIndex).map((track) => (
            <SwipeCard
              key={track.id}
              track={track}
              isTop={track.id === currentTrack.id}
              onSwipe={handleSwipe}
              isPlaying={isPlaying && nowPlayingTrackId === track.id.toString() && track.id === currentTrack.id}
            />
          )).reverse()}
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-8 mt-8">
        <Button
          onClick={() => handleButtonSwipe("left")}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-20 h-20 shadow-lg"
          aria-label="Dislike"
        >
          <X size={36} />
        </Button>
        <Button
          onClick={() => handleButtonSwipe("right")}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-20 h-20 shadow-lg"
          aria-label="Like"
        >
          <Heart size={36} />
        </Button>
      </div>

      {swipedTracks.length > 0 && (
        <div className="mt-4 text-center">
          <Button onClick={handleReset} variant="ghost" size="sm" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            リセット
          </Button>
        </div>
      )}
    </div>
  );
}