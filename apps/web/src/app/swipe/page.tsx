"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { Container } from "@/components/Container";
import { RequireAuth } from "@/components/RequireAuth";
import { SwipeStack } from "@/components/SwipeStack";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Track, type EvaluationStatus } from "@otodoki2/shared";

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
  const { isAuthenticated, user } = useAuth();
  const evaluatedTrackIdsRef = useRef<Set<string>>(new Set());

  const syncEvaluatedTracks = useCallback(async () => {
    try {
      const pageSize = 100;
      let offset = 0;
      const nextSet = new Set<string>();

      while (true) {
        const response = await api.evaluations.list({
          limit: pageSize,
          offset,
        });
        if (response.error) {
          console.warn("Failed to load evaluations", response.error);
          break;
        }

        const items = response.data?.items ?? [];
        items.forEach((item) => {
          nextSet.add(item.external_track_id);
        });

        if (items.length < pageSize) {
          break;
        }

        offset += pageSize;
      }

      evaluatedTrackIdsRef.current = nextSet;
      console.log(
        `[SWIPE] Loaded ${nextSet.size} previously evaluated tracks for user ${user?.id}`
      );
    } catch (err) {
      console.warn("Unexpected error loading evaluations", err);
    }
  }, [user?.id]);

  const toEvaluationStatus = useCallback(
    (direction: "left" | "right"): EvaluationStatus =>
      direction === "right" ? "like" : "dislike",
    []
  );

  const toEvaluationTrackPayload = useCallback(
    (track: Track) => ({
      external_id: String(track.id),
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork_url: track.artwork_url,
      preview_url: track.preview_url,
      primary_genre: track.genre,
      duration_ms: track.duration_ms,
    }),
    []
  );

  const fetchInitialTracks = useCallback(async () => {
    setLoading(true);
    setNoMoreTracks(false);
    setError(null);
    try {
      const excludeIds = Array.from(evaluatedTrackIdsRef.current);
      const response = await api.tracks.suggestions({
        limit: 20,
        excludeIds: excludeIds.join(","),
      });
      if (response.error) throw new Error(response.error.error);

      const apiTracks = response.data?.data || [];
      const filteredApiTracks = apiTracks.filter((track) => {
        const trackId = String(track.id);
        return !evaluatedTrackIdsRef.current.has(trackId);
      });

      console.log(`📱 Loaded ${filteredApiTracks.length} initial tracks.`);
      setTracks([instructionCard, ...filteredApiTracks]);
    } catch (err: unknown) {
      setError(
        `Error loading tracks: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      setTracks([instructionCard, ...fallbackTracks]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMoreTracks = useCallback(async () => {
    if (isFetchingMore || noMoreTracks || loading) return;

    setIsFetchingMore(true);
    console.log("[FETCH] Starting to fetch more tracks...");
    try {
      const existingIds = new Set(
        tracks.map((t) => t.id).filter((id) => !isNaN(Number(id)))
      );
      const excludeIds = Array.from(
        new Set([
          ...evaluatedTrackIdsRef.current,
          ...Array.from(existingIds).map((id) => String(id)),
        ])
      ).join(",");

      const response = await api.tracks.suggestions({ limit: 10, excludeIds });
      if (response.error) throw new Error(response.error.error);

      const newApiTracks = response.data?.data || [];
      if (newApiTracks.length === 0) {
        console.log("[FETCH] No more tracks returned from API.");
        setNoMoreTracks(true);
        return;
      }

      const uniqueNewTracks = newApiTracks.filter((track) => {
        const trackId = String(track.id);
        return (
          !existingIds.has(track.id) &&
          !evaluatedTrackIdsRef.current.has(trackId)
        );
      });

      console.log(`[FETCH] Fetched ${uniqueNewTracks.length} new tracks.`);
      setTracks((prevTracks) => [...prevTracks, ...uniqueNewTracks]);
    } catch (err: unknown) {
      console.error("Error fetching more tracks:", err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, noMoreTracks, loading, tracks]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTracks([instructionCard]);
      setLoading(false);
      return;
    }

    void (async () => {
      await syncEvaluatedTracks();
      await fetchInitialTracks();
    })();
  }, [fetchInitialTracks, isAuthenticated, syncEvaluatedTracks]);

  const handleSwipe = useCallback(
    (direction: "left" | "right", track: Track) => {
      if (track.id === "instruction-card") {
        console.log("Instruction card swiped.");
        setTracks((prev) => prev.filter((t) => t.id !== "instruction-card"));
        return;
      }
      if (typeof track.id === "string" && track.id.startsWith("swipe-")) {
        console.log(
          `[SWIPE] Skipping persistence for fallback track: ${track.title}`
        );
        return;
      }

      console.log(`[TELEMETRY] Swiped ${direction} on track: ${track.title}`);
      void (async () => {
        try {
          const payload = {
            status: toEvaluationStatus(direction),
            track: toEvaluationTrackPayload(track),
            source: "swipe",
          };

          const response = await api.evaluations.create(payload);
          if (response.error) {
            throw new Error(response.error.detail || response.error.error);
          }

          evaluatedTrackIdsRef.current.add(String(track.id));
          console.log(
            `[SWIPE] Stored ${payload.status} for track ${track.id} (user ${
              user?.id ?? "unknown"
            })`
          );
        } catch (err) {
          console.error("Failed to record evaluation", err);
          setError(
            (prev) =>
              prev ?? "スワイプ結果の保存に失敗しました。再試行してください。"
          );
        }
      })();
    },
    [toEvaluationStatus, toEvaluationTrackPayload, user?.id]
  );

  const handleStackEmpty = useCallback(() => {
    console.log("All tracks swiped! Resetting...");
    void fetchInitialTracks();
  }, [fetchInitialTracks]);

  const authLoadingNode = (
    <Container className="py-16">
      <p className="text-center text-muted-foreground">
        認証状態を確認しています...
      </p>
    </Container>
  );

  const authFallbackNode = (
    <Container className="py-16 space-y-4 text-center">
      <p className="text-muted-foreground">
        このページを利用するにはログインが必要です。
      </p>
      <Link href="/login">
        <Button size="sm" className="gap-2">
          ログイン
        </Button>
      </Link>
    </Container>
  );

  return (
    <Suspense fallback={authLoadingNode}>
      <RequireAuth loading={authLoadingNode} fallback={authFallbackNode}>
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
            <div className="mx-auto max-w-md space-y-2 text-center">
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
          </div>
        </Container>
      </RequireAuth>
    </Suspense>
  );
}
