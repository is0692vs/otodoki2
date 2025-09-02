"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { type Track } from "@/services";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export interface SwipeStackProps {
  tracks: Track[];
  onSwipe: (direction: "left" | "right", track: Track) => void;
  className?: string;
}

/**
 * A stateless component that displays a stack of swipeable cards.
 * It does not manage its own state and relies on props for data and event handling.
 */
export function SwipeStack({
  tracks,
  onSwipe,
  className,
}: SwipeStackProps) {
  // The track on top of the stack is the first one in the array.
  const currentTrack = tracks[0];

  // Handler for swipe buttons (Like/Dislike)
  const handleButtonSwipe = (direction: "left" | "right") => {
    if (currentTrack) {
      onSwipe(direction, currentTrack);
    }
  };

  // Enable keyboard shortcuts for swiping the top card.
  useKeyboardShortcuts({
    onArrowLeft: () => handleButtonSwipe("left"),
    onArrowRight: () => handleButtonSwipe("right"),
  });

  // Display a message if there are no tracks to show.
  if (!currentTrack) {
    return (
      <div className="text-center py-16 flex items-center justify-center h-full">
        <p className="text-muted-foreground">表示できる楽曲がありません。</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* The stack of cards */}
      <div className="relative h-[500px] w-full max-w-sm mx-auto">
        <AnimatePresence>
          {tracks
            .map((track, index) => {
              const isTop = index === 0;
              return (
                <SwipeCard
                  key={track.id}
                  track={track}
                  isTop={isTop}
                  // When a card is swiped via gesture, call the onSwipe prop
                  // with the direction and the specific track that was swiped.
                  onSwipe={(direction) => onSwipe(direction, track)}
                />
              );
            })
            .reverse() // Reverse so the last card in the array is at the bottom.
          }
        </AnimatePresence>
      </div>

      {/* Swipe control buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button
          onClick={() => handleButtonSwipe("left")}
          variant="outline"
          size="lg"
          className="rounded-full w-20 h-20"
          aria-label="Dislike"
        >
          <X className="h-8 w-8 text-red-500" />
        </Button>
        <Button
          onClick={() => handleButtonSwipe("right")}
          variant="outline"
          size="lg"
          className="rounded-full w-20 h-20"
          aria-label="Like"
        >
          <Heart className="h-8 w-8 text-green-500" />
        </Button>
      </div>
    </div>
  );
}
