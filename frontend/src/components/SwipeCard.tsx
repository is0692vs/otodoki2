"use client";

import React from "react";
import Image from "next/image";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Track } from "@/services";
import { Play, Pause, Music, Info } from "lucide-react";

export interface SwipeCardProps {
  track: Track;
  onSwipe?: (direction: "left" | "right", track: Track) => void;
  className?: string;
  isTop?: boolean;
  isPlaying?: boolean;
}

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
  const [exitX, setExitX] = React.useState(0);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 100;
    const swipePower = (offset: number, velocity: number) => {
      return Math.abs(offset) + velocity * 5;
    };
    const power = swipePower(info.offset.x, info.velocity.x);

    if (power > swipeThreshold) {
      const direction = info.offset.x > 0 ? "right" : "left";
      setExitX(x.get() + (direction === "right" ? 500 : -500));
      onSwipe?.(direction, track);
    } else {
      // 閾値を超えなかった場合は中央に戻す
      x.set(0);
    }
  };

  if (track.id === "instruction-card") {
    return (
      <motion.div
        className={cn(
          "absolute inset-0 cursor-grab active:cursor-grabbing",
          className
        )}
        style={{ x, rotate, opacity, zIndex: isTop ? 10 : 1 }}
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.05 }}
        initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
        animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
        exit={{
          x: exitX,
          opacity: 0,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.5,
          },
        }}
      >
        <Card className="w-full h-full overflow-hidden shadow-xl border-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center space-y-4">
            <Info className="w-12 h-12 text-primary" />
            <h2 className="text-2xl font-bold">{track.title}</h2>
            <p className="text-lg text-muted-foreground">{track.artist}</p>
            <div className="space-y-2 pt-4">
              <p>▶️ 音楽が自動で再生されます</p>
              <p>💔 左にスワイプ: 次の曲へ</p>
              <p>💚 右にスワイプ: ライブラリに保存</p>
            </div>
            <p className="pt-6 text-sm text-muted-foreground">このカードをスワイプして開始</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const isPlaceholder = track.artwork_url?.includes("via.placeholder.com");

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
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      exit={{
        x: exitX,
        opacity: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.5,
        },
      }}
    >
      <Card className="w-full h-full overflow-hidden shadow-xl border-2">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex-1 relative">
            {track.artwork_url ? (
              isPlaceholder ? (
                <img
                  src={track.artwork_url}
                  alt={`${track.title} by ${track.artist}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <Image
                  src={track.artwork_url}
                  alt={`${track.title} by ${track.artist}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={isTop}
                  className="object-cover"
                  draggable={false}
                />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <Music className="w-12 h-12 text-white" />
              </div>
            )}

            <motion.div
              className="absolute top-8 left-8 bg-red-500 text-white px-4 py-2 rounded-lg font-bold transform -rotate-12"
              style={{
                opacity: nopeOpacity,
              }}
            >
              NOPE
            </motion.div>

            <motion.div
              className="absolute top-8 right-8 bg-green-500 text-white px-4 py-2 rounded-lg font-bold transform rotate-12"
              style={{
                opacity: likeOpacity,
              }}
            >
              LIKE
            </motion.div>

            {isPlaying && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded-full animate-pulse">
                <Pause className="h-4 w-4" />
              </div>
            )}

            {!isPlaying && track.preview_url && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white p-2 rounded-full">
                <Play className="h-4 w-4" />
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-800 dark:bg-gray-900 text-white space-y-2">
            <h3 className="font-bold text-xl truncate" title={track.title}>
              {track.title}
            </h3>
            <p
              className="text-gray-300 text-lg truncate"
              title={track.artist}
            >
              {track.artist}
            </p>
            {track.album && (
              <p
                className="text-gray-400 text-sm truncate"
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
