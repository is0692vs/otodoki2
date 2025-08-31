'use client';


import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { Button } from "@/components/ui/button";
import { Heart, X, RotateCcw } from "lucide-react";
import { type Track } from '@/services';

export interface SwipeStackProps {
  tracks: Track[];
  onSwipe?: (direction: 'left' | 'right', track: Track) => void;
import { type Track } from "@/services";

export interface SwipeStackProps {
  tracks: Track[];
  onSwipe?: (direction: "left" | "right", track: Track) => void;
  onStackEmpty?: () => void;
  className?: string;
}

export function SwipeStack({ tracks, onSwipe, onStackEmpty, className }: SwipeStackProps) {
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

  const handleSwipe = (direction: 'left' | 'right', track: Track) => {
    setSwipedTracks(prev => [...prev, track]);
    setCurrentIndex(prev => {
  const handleSwipe = (direction: "left" | "right", track: Track) => {
    console.log(
      "SwipeStack received swipe:",
      direction,
      "for track:",
      track.title
    );
    setSwipedTracks((prev) => [...prev, track]);
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= tracks.length) {
        onStackEmpty?.();
        return 0; // Reset to beginning
      }
      return next;
    });
    onSwipe?.(direction, track);
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
  const handleButtonSwipe = (direction: "left" | "right") => {
    if (currentTrack) {
      handleSwipe(direction, currentTrack);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSwipedTracks([]);
  };

  if (!currentTrack) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">すべての楽曲をスワイプしました！</p>
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
      {/* Stack Container */}
      <div className="relative h-[500px] w-full max-w-sm mx-auto">
        {/* Background cards */}
        {nextTracks.map((track, index) => (
          <div
            key={track.id}
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: nextTracks.length - index,
              transform: `scale(${0.95 - index * 0.05}) translateY(${(index + 1) * 10}px)`,

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
        <AnimatePresence mode="wait">
          <SwipeCard
            key={currentTrack.id}
            track={currentTrack}
            onSwipe={handleSwipe}
            isTop={true}
          />
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleButtonSwipe('left')}
          onClick={() => handleButtonSwipe("left")}
          className="h-14 w-14 rounded-full border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <X className="h-6 w-6 text-red-500" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleButtonSwipe('right')}

        <Button
          variant="outline"
          size="lg"
          onClick={() => handleButtonSwipe("right")}
          className="h-14 w-14 rounded-full border-green-200 hover:bg-green-50 hover:border-green-300"
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
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / tracks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Reset button */}
      {swipedTracks.length > 0 && (
        <div className="mt-4 text-center">
          <Button onClick={handleReset} variant="ghost" size="sm" className="gap-2">
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
}
