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
  artwork_url: "",
  preview_url: "",
  album: "ルール説明",
  duration_ms: 0,
  genre: "Tutorial",
};

const fallbackTracks: Track[] = [
  // Fallback tracks remain the same
];

export default function SwipePage() {
  const [tracks, setTracks] = useState<Track[]>([instructionCard]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [noMoreTracks, setNoMoreTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialTracks = async () => {
    setLoading(true);
    setNoMoreTracks(false);
    setError(null);
    try {
      const dislikedIds = new Set(getDislikedTracks().map(t => t.trackId));
      const response = await api.tracks.suggestions({ limit: 20 });
      if (response.error) throw new Error(response.error.error);

      const apiTracks = response.data?.data || [];
      const filteredApiTracks = apiTracks.filter(
        (track) => !dislikedIds.has(Number(track.id))
      );

      console.log(`📱 Loaded ${filteredApiTracks.length} initial tracks.`);
      setTracks([instructionCard, ...filteredApiTracks]);
    } catch (err: unknown) {
      setError(`Error loading tracks: ${err instanceof Error ? err.message : String(err)}`);
      setTracks([instructionCard, ...fallbackTracks]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreTracks = useCallback(async () => {
    if (isFetchingMore || noMoreTracks || loading) return;

    setIsFetchingMore(true);
    console.log("[FETCH] Starting to fetch more tracks...");
    try {
      const dislikedIds = new Set(getDislikedTracks().map(t => t.trackId));
      const existingIds = new Set(tracks.map(t => t.id).filter(id => !isNaN(Number(id))));
      const excludeIds = Array.from(new Set([...dislikedIds, ...existingIds])).join(',');

      const response = await api.tracks.suggestions({ limit: 10, excludeIds });
      if (response.error) throw new Error(response.error.error);

      const newApiTracks = response.data?.data || [];
      if (newApiTracks.length === 0) {
        console.log("[FETCH] No more tracks returned from API.");
        setNoMoreTracks(true);
        return;
      }

      const uniqueNewTracks = newApiTracks.filter(
        (track) => !existingIds.has(track.id)
      );

      console.log(`[FETCH] Fetched ${uniqueNewTracks.length} new tracks.`);
      setTracks((prevTracks) => [...prevTracks, ...uniqueNewTracks]);

    } catch (err: unknown) {
      console.error("Error fetching more tracks:", err);
      // Don't set a global error, just log it.
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, noMoreTracks, loading, tracks]);

  useEffect(() => {
    fetchInitialTracks();
  }, []);

  const handleSwipe = (direction: "left" | "right", track: Track) => {
    if (track.id === "instruction-card") {
      console.log("Instruction card swiped.");
      return;
    }
    if (typeof track.id === 'string' && track.id.startsWith("swipe-")) {
      console.log(`[STORAGE] Skipping save for fallback track: ${track.title}`);
      return;
    }

    console.log(`[TELEMETRY] Swiped ${direction} on track: ${track.title}`);
    try {
      if (direction === "right") {
        saveLikedTrack(track);
      } else {
        saveDislikedTrack(track);
      }
    } catch (error) {
      console.warn(`[STORAGE] Failed to save swipe action`, error);
    }
  };

  const handleStackEmpty = () => {
    console.log("All tracks swiped! Resetting...");
    fetchInitialTracks();
  };

  return (
    <Container className="py-8">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header and Instructions remain the same */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">楽曲スワイプ</h1>
          <div className="w-20" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            楽曲をスワイプして好みを設定しましょう
          </p>
          {/* ... */}
        </div>

        {error && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-600 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">楽曲を読み込み中...</p>
          </div>
        ) : (
          <SwipeStack
            tracks={tracks}
            onSwipe={handleSwipe}
            onLowOnTracks={fetchMoreTracks}
            onStackEmpty={handleStackEmpty}
            noMoreTracks={noMoreTracks}
          />
        )}

        {isFetchingMore && (
            <div className="text-center py-4">
                <p className="text-muted-foreground">次の楽曲を読み込み中...</p>
            </div>
        )}
      </div>
    </Container>
  );
}
