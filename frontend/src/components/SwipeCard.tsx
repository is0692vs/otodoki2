'use client';

import React, { useRef } from "react";

"use client";

import React from "react";
import Image from "next/image";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Track } from '@/services';

export interface SwipeCardProps {
  track: Track;
  onSwipe?: (direction: 'left' | 'right', track: Track) => void;
import { type Track } from "@/services";
import { Play, Pause } from "lucide-react";

export interface SwipeCardProps {
  track: Track;
  onSwipe?: (direction: "left" | "right", track: Track) => void;

  className?: string;
  isTop?: boolean;
  isPlaying?: boolean;
}

export function SwipeCard({ track, onSwipe, className, isTop = false }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const exitDirection = useRef<'left' | 'right' | null>(null);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      exitDirection.current = direction;

export function SwipeCard({
  track,
  onSwipe,
  className,
  isTop = false,
  isPlaying = false,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const [swipeInfo, setSwipeInfo] = React.useState<{
    direction: "left" | "right";
    offsetX: number;
  } | null>(null);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 100;

    if (Math.abs(info.offset.x) > swipeThreshold) {
      const direction = info.offset.x > 0 ? "right" : "left";

      // Set swipe info immediately for consistent exit animation
      setSwipeInfo({ direction, offsetX: info.offset.x });


      onSwipe?.(direction, track);
    }
  };

  return (
    <motion.div
      className={cn(
        "absolute inset-0 cursor-grab active:cursor-grabbing",
        className
      )}
      style={{ 
        x, 
        rotate, 
      style={{
        x,
        rotate,
        opacity,
        zIndex: isTop ? 10 : 1,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      exit={{

        x: swipeInfo?.offsetX
          ? swipeInfo.offsetX > 0
            ? 1000
            : -1000
          : x.get() > 0
          ? 1000
          : -1000,

        x: exitDirection.current === 'right' ? 1000 : -1000,
        opacity: 0,
        transition: { duration: 0.5 }
        x: swipeInfo?.offsetX && swipeInfo.offsetX > 0 ? 1000 : -1000,

        opacity: 0,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
    >
      <Card className="w-full h-full overflow-hidden shadow-xl border-2">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Album Artwork */}
          <div className="flex-1 relative">
            {track.artwork_url ? (
              <Image
                src={track.artwork_url}
                alt={`${track.title} by ${track.artist}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={isTop}
                className="object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <div className="text-white text-2xl font-bold">♪</div>
              </div>
            )}

            {/* Swipe indicators */}
            <motion.div
              className="absolute top-8 left-8 bg-red-500 text-white px-4 py-2 rounded-lg font-bold transform -rotate-12"
              style={{
                opacity: useTransform(x, [-100, 0], [1, 0])

                opacity: useTransform(x, [-100, 0], [1, 0]),
              }}
            >
              NOPE
            </motion.div>
            
            <motion.div
              className="absolute top-8 right-8 bg-green-500 text-white px-4 py-2 rounded-lg font-bold transform rotate-12"
              style={{
                opacity: useTransform(x, [0, 100], [0, 1])


            <motion.div
              className="absolute top-8 right-8 bg-green-500 text-white px-4 py-2 rounded-lg font-bold transform rotate-12"
              style={{
                opacity: useTransform(x, [0, 100], [0, 1]),
              }}
            >
              LIKE
            </motion.div>

            {/* Playing indicator */}
            {isPlaying && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded-full animate-pulse">
                <Pause className="h-4 w-4" />
              </div>
            )}

            {/* Preview available indicator */}
            {!isPlaying && track.preview_url && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded-full">
                <Play className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="p-6 bg-white dark:bg-card space-y-2">
            <h3 className="font-bold text-xl truncate" title={track.title}>
              {track.title}
            </h3>
            <p className="text-muted-foreground text-lg truncate" title={track.artist}>
              {track.artist}
            </p>
            {track.album && (
              <p className="text-sm text-muted-foreground truncate" title={track.album}>

            <p
              className="text-muted-foreground text-lg truncate"
              title={track.artist}
            >
              {track.artist}
            </p>
            {track.album && (
              <p
                className="text-sm text-muted-foreground truncate"
                title={track.album}
              >

                {track.album}
              </p>
            )}
            {track.genre && (
              <span className="inline-block bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                {track.genre}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
}
