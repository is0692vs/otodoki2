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
  const nextTracks = tracks.slice(currentIndex + 1, currentIndex + 3);

  const isInstructionCard = currentTrack?.id === "instruction-card";

  const audioPlayer = useAudioPlayer({
    autoPlay: !isInstructionCard,
    defaultMuted: false,
    volume: 0.7,
    onTrackEnd: useCallback(() => {
      // This callback can't be dependent on `audioPlayer` because it's part of the initialization.
      // The linter will complain, but it's a necessary exception to avoid a ReferenceError.
      // The functions on `audioPlayer` are stable, so this is safe.
      if (currentTrack && currentTrack.preview_url && !isInstructionCard) {
        // トラックの終了時に再度再生を開始
        audioPlayer.playTrack(currentTrack);
      }
    }, [currentTrack, isInstructionCard]),
    onPlaybackError: useCallback((error: string) => {
      console.warn("Audio error:", error);
    }, []),
  });

  const { ref: stackRef, isVisible: isStackVisible } = useVisibility({
    onVisibilityChange: (visible) => {
      if (!visible && audioPlayer.isPlaying) {
        audioPlayer.pause();
      }
    },
    threshold: 0.5,
  });

  const isPageVisible = usePageVisibility();

  useKeyboardShortcuts({
    onSpacePress: () => {
      if (currentTrack && !isInstructionCard) {
        audioPlayer.togglePlay();
      }
    },
    onArrowLeft: () => handleButtonSwipe("left"),
    onArrowRight: () => handleButtonSwipe("right"),
  });

  useEffect(() => {
    if (currentTrack && !isInstructionCard && isStackVisible && isPageVisible) {
      audioPlayer.playTrack(currentTrack);

      const nextTrack = tracks[currentIndex + 1];
      if (nextTrack) {
        audioPlayer.preloadTrack(nextTrack);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isStackVisible, isPageVisible, tracks, isInstructionCard]);

  useEffect(() => {
    if (!isPageVisible && audioPlayer.isPlaying) {
      audioPlayer.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPageVisible]);

  const handleSwipe = useCallback(
    (direction: "left" | "right", track: Track) => {
      if (!isInstructionCard) {
        audioPlayer.stop();
      }
      onSwipe?.(direction, track);

      // Defer state updates to avoid race condition with framer-motion
      setTimeout(() => {
        setSwipedTracks((prev) => [...prev, track]);
        if (track.id !== "instruction-card") {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 0);
    },
    [isInstructionCard, audioPlayer, onSwipe]
  );

  const handleButtonSwipe = (direction: "left" | "right") => {
    if (currentTrack) {
      handleSwipe(direction, currentTrack);
    }
  };

  const onExitComplete = () => {
    if (currentIndex >= tracks.length && tracks.length > 0) {
      onStackEmpty?.();
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
        <p className="text-muted-foreground">すべての楽曲をスワイプしました！</p>
        <Button onClick={handleReset} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          リセット
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
              onClick={audioPlayer.togglePlay}
              disabled={!audioPlayer.canPlay && !audioPlayer.isPlaying}
              className="gap-2"
            >
              {audioPlayer.isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={audioPlayer.toggleMute}
              className="gap-2"
            >
              {audioPlayer.isMuted ? <VolumeX /> : <Volume2 />}
            </Button>
          </div>
          <div className="text-center mb-4">
            {audioPlayer.isLoading && <p>Loading...</p>}
            {audioPlayer.error && (
              <p className="text-red-500">{audioPlayer.error}</p>
            )}
            {!currentTrack.preview_url && <p>Preview not available</p>}
          </div>
        </>
      )}

      <div
        ref={stackRef}
        className="relative h-[500px] w-full max-w-sm mx-auto"
      >
        <AnimatePresence onExitComplete={onExitComplete}>
          {tracks
            .slice(currentIndex)
            .map((track, index) => {
              const isTop = index === 0;
              const playAudio = isTop && !isInstructionCard; // 最上位かつ説明カードではない場合のみ音声を再生
              return (
                <SwipeCard
                  key={track.id}
                  track={track}
                  isTop={isTop}
                  onSwipe={handleSwipe}
                  isPlaying={
                    audioPlayer.isPlaying &&
                    audioPlayer.nowPlayingTrackId === track.id.toString() &&
                    playAudio
                  }
                />
              );
            })
            .reverse()}
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <Button onClick={() => handleButtonSwipe("left")}>
          <X />
        </Button>
        <Button onClick={() => handleButtonSwipe("right")}>
          <Heart />
        </Button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} / {tracks.length}
        </p>
      </div>

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
