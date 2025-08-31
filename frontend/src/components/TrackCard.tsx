import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
}

export function TrackCard({ track, className }: TrackCardProps) {
  return (
    <Card className={cn("w-full max-w-sm overflow-hidden hover:shadow-lg transition-shadow", className)}>
      <CardContent className="p-0">
        {/* Album Artwork */}
        <div className="aspect-square relative">
          {track.artwork_url ? (
            <Image
              src={track.artwork_url}
              alt={`${track.title} by ${track.artist}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-muted-foreground text-sm">No Image</div>
            </div>
          )}
        </div>
        
        {/* Track Info */}
        <div className="p-4 space-y-1">
          <h3 className="font-semibold text-sm truncate" title={track.title}>
            {track.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate" title={track.artist}>
            {track.artist}
          </p>
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
    genre: "Rock"
  },
  {
    id: "2", 
    title: "Imagine",
    artist: "John Lennon",
    artwork_url: "https://via.placeholder.com/300x300/3b82f6/ffffff?text=Imagine",
    album: "Imagine",
    duration_ms: 183000,
    genre: "Pop"
  },
  {
    id: "3",
    title: "Billie Jean",
    artist: "Michael Jackson",
    album: "Thriller",
    duration_ms: 294000,
    genre: "Pop"
    // No artwork_url to test fallback
  }
];