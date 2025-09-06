import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type Track } from "@/services";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// StoredTrack type definition (for liked tracks)
export interface StoredTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl: string;
  previewUrl: string;
  collectionName?: string;
  primaryGenreName?: string;
  savedAt: string;
}

// StoredDislikedTrack type definition (for disliked tracks)
export interface StoredDislikedTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl: string;
  previewUrl: string;
  collectionName?: string;
  primaryGenreName?: string;
  dislikedAt: string;
  ttlSec?: number;
}

// Converters
export function storedTrackToTrack(storedTrack: StoredTrack): Track {
  return {
    id: storedTrack.trackId,
    title: storedTrack.trackName,
    artist: storedTrack.artistName,
    artwork_url: storedTrack.artworkUrl,
    preview_url: storedTrack.previewUrl,
    album: storedTrack.collectionName,
    genre: storedTrack.primaryGenreName,
  };
}

export function storedDislikedTrackToTrack(storedDislikedTrack: StoredDislikedTrack): Track {
  return {
    id: storedDislikedTrack.trackId,
    title: storedDislikedTrack.trackName,
    artist: storedDislikedTrack.artistName,
    artwork_url: storedDislikedTrack.artworkUrl,
    preview_url: storedDislikedTrack.previewUrl,
    album: storedDislikedTrack.collectionName,
    genre: storedDislikedTrack.primaryGenreName,
  };
}
