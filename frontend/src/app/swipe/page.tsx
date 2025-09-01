"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/Container";
import { SwipeStack } from "@/components/SwipeStack";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, type Track } from "@/services";
import { getDislikedTrackIds, saveDislikedTrackId, saveLikedTrack } from "@/lib/storage";

// Helper function to normalize track ID consistently with storage
function normalizeTrackId(id: string | number): number {
  if (typeof id === "number") {
    if (isNaN(id) || id <= 0) {
      throw new Error(`Invalid track ID: ${id}`);
    }
    return id;
  }
  
  // For string IDs, try to parse as number first
  const numId = parseInt(id, 10);
  if (!isNaN(numId) && numId > 0) {
    return numId;
  }
  
  // For non-numeric string IDs (like "swipe-1"), create a hash-based ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive number
  const positiveHash = Math.abs(hash);
  if (positiveHash === 0) {
    return 1; // Fallback for edge case
  }
  
  return positiveHash;
}

// Fallback demo tracks for when API is unavailable
const fallbackTracks: Track[] = [
  {
    id: "swipe-1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    artwork_url: "https://via.placeholder.com/300x300/1f2937/ffffff?text=Queen",
    preview_url: "https://www.soundjay.com/misc/sounds/beep-07a.mp3", // Demo audio
    album: "A Night at the Opera",
    duration_ms: 355000,
    genre: "Rock",
  },
  {
    id: "swipe-2",
    title: "Imagine",
    artist: "John Lennon",
    artwork_url:
      "https://via.placeholder.com/300x300/3b82f6/ffffff?text=Imagine",
    preview_url: "https://www.soundjay.com/misc/sounds/beep-08a.mp3", // Demo audio
    album: "Imagine",
    duration_ms: 183000,
    genre: "Pop",
  },
  {
    id: "swipe-3",
    title: "Billie Jean",
    artist: "Michael Jackson",
    artwork_url: "https://via.placeholder.com/300x300/8b5cf6/ffffff?text=MJ",
    preview_url: "https://www.soundjay.com/misc/sounds/beep-09a.mp3", // Demo audio
    album: "Thriller",
    duration_ms: 294000,
    genre: "Pop",
  },
  {
    id: "swipe-4",
    title: "Hotel California",
    artist: "Eagles",
    artwork_url:
      "https://via.placeholder.com/300x300/f59e0b/ffffff?text=Eagles",
    preview_url: "https://www.soundjay.com/misc/sounds/beep-10a.mp3", // Demo audio
    album: "Hotel California",
    duration_ms: 391000,
    genre: "Rock",
  },
  {
    id: "swipe-5",
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    artwork_url: "https://via.placeholder.com/300x300/ef4444/ffffff?text=LZ",
    album: "Led Zeppelin IV",
    duration_ms: 482000,
    genre: "Rock",
    // No preview_url to test fallback behavior
  },
];

export default function SwipePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tracks for swiping
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);

        // Get disliked track IDs to filter out
        const dislikedIds = new Set(getDislikedTrackIds());
        console.log(`🚫 Filtering out ${dislikedIds.size} disliked tracks`);

        const response = await api.tracks.suggestions({ limit: 20 });
        if (response.error) {
          setError(`Failed to load tracks: ${response.error.error}`);
          // Use fallback data when API fails, but still filter dislikes
          const filteredFallback = fallbackTracks.filter(
            (track) => !dislikedIds.has(normalizeTrackId(track.id))
          );
          setTracks(filteredFallback);
        } else {
          const apiTracks = response.data?.data || [];
          // Mix API tracks with fallback tracks for better demo
          const allTracks = [...apiTracks, ...fallbackTracks];
          // Filter out disliked tracks
          const filteredTracks = allTracks.filter(
            (track) => !dislikedIds.has(normalizeTrackId(track.id))
          );
          console.log(
            `📱 Loaded ${filteredTracks.length} tracks (${
              allTracks.length - filteredTracks.length
            } filtered out)`
          );
          setTracks(filteredTracks.slice(0, 20));
        }
      } catch (err) {
        setError(`Error loading tracks: ${err}`);
        // Use fallback data when API fails, but still filter dislikes
        const dislikedIds = new Set(getDislikedTrackIds());
        const filteredFallback = fallbackTracks.filter(
          (track) => !dislikedIds.has(normalizeTrackId(track.id))
        );
        setTracks(filteredFallback);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  const handleSwipe = (direction: "left" | "right", track: Track) => {
    console.log(`Swiped ${direction} on track:`, track.title);
    
    if (direction === "right") {
      // Track liked - save to localStorage
      const success = saveLikedTrack(track);
      if (success) {
        console.log(`💚 Liked track saved: ${track.title} by ${track.artist}`);
      } else {
        console.warn(`Failed to save liked track: ${track.title}`);
      }
    } else {
      // Track disliked - save track ID to localStorage
      const success = saveDislikedTrackId(track.id);
      if (success) {
        console.log(`🚫 Disliked track saved: ${track.title} by ${track.artist}`);
      } else {
        console.warn(`Failed to save disliked track: ${track.title}`);
      }
    }
  };

  const handleStackEmpty = () => {
    console.log("All tracks swiped! Loading more...");
    // Reload tracks or fetch more
    setTracks([...fallbackTracks]);
  };

  return (
    <Container className="py-8">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">楽曲スワイプ</h1>
          <div className="w-20" /> {/* Spacer for center alignment */}
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            楽曲をスワイプして好みを設定しましょう
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded"></span>
              左スワイプ = 好みではない
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded"></span>
              右スワイプ = 好み
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-600 text-sm">{error}</p>
            <p className="text-orange-500 text-xs mt-1">
              フォールバックデータを使用しています
            </p>
          </div>
        )}

        {/* Swipe Stack */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">楽曲を読み込み中...</p>
          </div>
        ) : (
          <SwipeStack
            tracks={tracks}
            onSwipe={handleSwipe}
            onStackEmpty={handleStackEmpty}
          />
        )}
      </div>
    </Container>
  );
}
