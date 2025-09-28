import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, Music } from "lucide-react";

// Track interface matching backend model
export interface Track {
  id: string | number;
  title: string;
  artist: string;
  artwork_url?: string;
  preview_url?: string;
  album?: string;
  duration_ms?: number;
  genre?: string;
}

export interface TrackCardProps {
  track: Track;
  className?: string;
  // Audio control props
  isPlaying?: boolean;
  canPlay?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onPlayToggle?: () => void;
  showAudioControls?: boolean;
}

export function TrackCard({
  track,
  className,
  isPlaying = false,
  canPlay = false,
  isLoading = false,
  error = null,
  onPlayToggle,
  showAudioControls = false,
}: TrackCardProps) {
  const hasPreview = Boolean(track.preview_url);

  return (
    <Card
      className={cn(
        "w-full max-w-sm overflow-hidden hover:shadow-lg transition-shadow group",
        className
      )}
    >
      <CardContent className="p-0">
        {/* Album Artwork */}
        <div className="aspect-square relative">
          {track.artwork_url ? (
            <Image
              src={track.artwork_url}
              alt={`${track.title} by ${track.artist}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={isPlaying}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Music className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Audio Controls Overlay */}
          {showAudioControls && hasPreview && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayToggle?.();
                }}
                disabled={!canPlay && !isPlaying}
                className="h-12 w-12 rounded-full"
                aria-label={isPlaying ? "一時停止" : "再生"}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* Preview indicator */}
          {!showAudioControls && hasPreview && (
            <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full">
              <Play className="h-3 w-3" />
            </div>
          )}

          {/* Playing indicator */}
          {showAudioControls && isPlaying && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium animate-pulse">
              再生中
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="p-4 space-y-1">
          <h3 className="font-semibold text-sm truncate" title={track.title}>
            {track.title}
          </h3>
          <p
            className="text-sm text-muted-foreground truncate"
            title={track.artist}
          >
            {track.artist}
          </p>

          {/* Error message */}
          {showAudioControls && error && (
            <p className="text-xs text-amber-600 truncate" title={error}>
              {error}
            </p>
          )}

          {/* No preview available */}
          {showAudioControls && !hasPreview && (
            <p className="text-xs text-muted-foreground">プレビュー利用不可</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Dummy data for demonstration
export const dummyTracks: Track[] = [
  {
    id: "1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    artwork_url: "https://via.placeholder.com/300x300/1f2937/ffffff?text=Queen",
    album: "A Night at the Opera",
    duration_ms: 355000,
    genre: "Rock",
  },
  {
    id: "2",
    title: "Imagine",
    artist: "John Lennon",
    artwork_url:
      "https://via.placeholder.com/300x300/3b82f6/ffffff?text=Imagine",
    album: "Imagine",
    duration_ms: 183000,
    genre: "Pop",
  },
  {
    id: "3",
    title: "Billie Jean",
    artist: "Michael Jackson",
    album: "Thriller",
    duration_ms: 294000,
    genre: "Pop",
    // No artwork_url to test fallback
  },
];
