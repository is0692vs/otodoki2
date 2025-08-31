'use client';

import React from "react";
import Image from "next/image";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Track } from '@/services';

export interface SwipeCardProps {
  track: Track;
  onSwipe?: (direction: 'left' | 'right', track: Track) => void;
  className?: string;
  isTop?: boolean;
}

export function SwipeCard({ track, onSwipe, className, isTop = false }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
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
        x: x.get() > 0 ? 1000 : -1000,
        opacity: 0,
        transition: { duration: 0.5 }
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
              }}
            >
              NOPE
            </motion.div>
            
            <motion.div
              className="absolute top-8 right-8 bg-green-500 text-white px-4 py-2 rounded-lg font-bold transform rotate-12"
              style={{
                opacity: useTransform(x, [0, 100], [0, 1])
              }}
            >
              LIKE
            </motion.div>
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