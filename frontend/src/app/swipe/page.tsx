// frontend/src/app/swipe/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Container } from "@/components/Container";
import { SwipeStack } from "@/components/SwipeStack";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, type Track } from "@/services";
import {
  getDislikedTracks,
  saveDislikedTrack,
  saveLikedTrack,
} from "@/lib/storage";

const instructionCard: Track = {
  id: "instruction-card",
  title: "スワイプして始めよう",
  artist: "左右にスワイプして、好きな曲を見つけよう！",
  artwork_url: "", // No artwork for instruction card
  preview_url: "", // No audio for instruction card
  album: "ルール説明",
  duration_ms: 0,
  genre: "Tutorial",
};

// Fallback demo tracks for when API is unavailable
const fallbackTracks: Track[] = [
  {
    id: "swipe-1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    artwork_url: "",
    preview_url: "https://www.soundjay.com/misc/sounds/beep-07a.mp3", // Demo audio
    album: "A Night at the Opera",
    duration_ms: 355000,
    genre: "Rock",
  },
  {
    id: "swipe-2",
    title: "Imagine",
    artist: "John Lennon",
    artwork_url: "",
    preview_url: "https://www.soundjay.com/misc/sounds/beep-08a.mp3", // Demo audio
    album: "Imagine",
    duration_ms: 183000,
    genre: "Pop",
  },
];

export default function SwipePage() {
  const [tracks, setTracks] = useState<Track[]>([instructionCard]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = async () => {
    setLoading(true);
    setError(null);
    try {
      const dislikedIds = new Set(getDislikedTracks().map(t => t.trackId));
      console.log(`🚫 Filtering out ${dislikedIds.size} disliked tracks`);

      const response = await api.tracks.suggestions({ limit: 20 });
      if (response.error) {
        throw new Error(response.error.error);
      }

      const apiTracks = response.data?.data || [];
      const filteredApiTracks = apiTracks.filter(
        (track) => !dislikedIds.has(Number(track.id))
      );

      console.log(
        `📱 Loaded ${filteredApiTracks.length} tracks from API (${
          apiTracks.length - filteredApiTracks.length
        } filtered out)`
      );

      const finalTracks = [
        instructionCard,
        ...filteredApiTracks,
        ...fallbackTracks,
      ];
      setTracks(finalTracks.slice(0, 21)); // 20 songs + instruction card
    } catch (err: unknown) {
      setError(`Error loading tracks: ${err instanceof Error ? err.message : String(err)}`);
      setTracks([instructionCard, ...fallbackTracks]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  // 現在のtracksをコンソールに出力
  useEffect(() => {
    console.log("Current tracks in queue:", tracks.map(t => t.title));
  }, [tracks]);

  const handleSwipe = useCallback((direction: "left" | "right", track: Track) => {
    if (track.id === "instruction-card") {
      console.log("Instruction card swiped.");
      // Remove the instruction card from the list
      setTracks((prev) => prev.filter((t) => t.id !== "instruction-card"));
      return;
    }

    // Skip saving for fallback tracks
    if (typeof track.id === 'string' && track.id.startsWith("swipe-")) {
      console.log(`[STORAGE] Skipping save for fallback track: ${track.title}`);
      return;
    }

    console.log(`[TELEMETRY] Swiped ${direction} on track: ${track.title}`);
    try {
      if (direction === "right") {
        saveLikedTrack(track);
        console.log(`[STORAGE] Saved liked track: ${track.title}`);
      } else {
        saveDislikedTrack(track);
        console.log(`[STORAGE] Saved disliked track ID: ${track.id}`);
      }
    } catch (error) {
      console.warn(`[STORAGE] Failed to save swipe action`, error);
    }
  }, []);

  const handleStackEmpty = () => {
    console.log("All tracks swiped! Loading more...");
    fetchTracks();
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
            // onTrackEnded は削除
          />
        )}
      </div>
    </Container>
  );
}
