"use client";

import { useState, useEffect, useCallback } from "react";
import { Container } from "@/components/Container";
import { RequireAuth } from "@/components/RequireAuth";
import { PlayableTrackCard } from "@/components/PlayableTrackCard";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Heart,
  Trash2,
  RotateCcw,
  ThumbsDown,
  ChevronRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/services";
import { EvaluationResponse, Track } from "@/services/types";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const FALLBACK_TITLE = "タイトル情報なし";
const FALLBACK_ARTIST = "アーティスト情報なし";

function evaluationToTrack(evaluation: EvaluationResponse): Track {
  const payload = evaluation.track;

  return {
    id: payload?.external_id ?? evaluation.external_track_id,
    title: payload?.title ?? FALLBACK_TITLE,
    artist: payload?.artist ?? FALLBACK_ARTIST,
    artwork_url: payload?.artwork_url ?? undefined,
    preview_url: payload?.preview_url ?? undefined,
    album: payload?.album ?? undefined,
    duration_ms: payload?.duration_ms ?? undefined,
    genre: payload?.primary_genre ?? undefined,
  };
}

function mapEvaluationsToTracks(items?: EvaluationResponse[]): Track[] {
  if (!items || items.length === 0) {
    return [];
  }
  return items.map(evaluationToTrack);
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Library() {
  const { isAuthenticated, user, tokens } = useAuth();
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [dislikedTracks, setDislikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const TRACK_LIMIT = 12;

  const loadTracks = useCallback(async () => {
    if (!isAuthenticated) {
      setLikedTracks([]);
      setDislikedTracks([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [likedRes, dislikedRes] = await Promise.all([
        api.evaluations.list({ status: "like", limit: 200, offset: 0 }),
        api.evaluations.list({ status: "dislike", limit: 200, offset: 0 }),
      ]);

      let nextError: string | null = null;

      if (likedRes.data) {
        setLikedTracks(mapEvaluationsToTracks(likedRes.data.items));
      } else {
        setLikedTracks([]);
        nextError =
          likedRes.error?.detail ??
          likedRes.error?.error ??
          "お気に入り楽曲の取得に失敗しました。";
      }

      if (dislikedRes.data) {
        setDislikedTracks(mapEvaluationsToTracks(dislikedRes.data.items));
      } else {
        setDislikedTracks([]);
        if (!nextError) {
          nextError =
            dislikedRes.error?.detail ??
            dislikedRes.error?.error ??
            "スキップした楽曲の取得に失敗しました。";
        }
      }

      if (nextError) {
        setError(nextError);
      }
    } catch (err) {
      console.error("ライブラリの取得中にエラーが発生しました", err);
      setLikedTracks([]);
      setDislikedTracks([]);
      setError(
        err instanceof Error
          ? err.message
          : "ライブラリの取得中に予期しないエラーが発生しました。"
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  const handleRemoveTrack = useCallback(
    async (trackId: string | number) => {
      setError(null);
      setLoading(true);

      const response = await api.evaluations.delete(String(trackId));
      if (response.error) {
        const message =
          response.error.detail ??
          response.error.error ??
          "お気に入りから削除できませんでした。";
        setError(message);
        setLoading(false);
        return;
      }

      await loadTracks();
    },
    [loadTracks]
  );

  const handleClearAll = useCallback(async () => {
    if (likedTracks.length === 0) {
      return;
    }

    const confirmed = confirm(
      "すべてのお気に入り楽曲を削除しますか？この操作は元に戻せません。"
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setLoading(true);

    const responses = await Promise.all(
      likedTracks.map((track) => api.evaluations.delete(String(track.id)))
    );

    const failed = responses.find((res) => res.error);
    if (failed?.error) {
      const message =
        failed.error.detail ??
        failed.error.error ??
        "お気に入りの一括削除に失敗しました。";
      setError(message);
      setLoading(false);
      return;
    }

    await loadTracks();
  }, [likedTracks, loadTracks]);

  const handleRemoveDislikedTrack = useCallback(
    async (trackId: string | number) => {
      setError(null);
      setLoading(true);

      const response = await api.evaluations.delete(String(trackId));
      if (response.error) {
        const message =
          response.error.detail ??
          response.error.error ??
          "スキップ履歴から削除できませんでした。";
        setError(message);
        setLoading(false);
        return;
      }

      await loadTracks();
    },
    [loadTracks]
  );

  const handleClearDislikedTracks = useCallback(async () => {
    if (dislikedTracks.length === 0) {
      return;
    }

    const confirmed = confirm(
      "すべてのスキップ楽曲を削除しますか？この操作は元に戻せません。"
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setLoading(true);

    const responses = await Promise.all(
      dislikedTracks.map((track) => api.evaluations.delete(String(track.id)))
    );

    const failed = responses.find((res) => res.error);
    if (failed?.error) {
      const message =
        failed.error.detail ??
        failed.error.error ??
        "スキップ楽曲の一括削除に失敗しました。";
      setError(message);
      setLoading(false);
      return;
    }

    await loadTracks();
  }, [dislikedTracks, loadTracks]);

  const loadingNode = (
    <Container className="py-16">
      <p className="text-center text-muted-foreground">
        ライブラリを読み込み中...
      </p>
    </Container>
  );

  const fallbackNode = (
    <Container className="py-16 space-y-4 text-center">
      <p className="text-muted-foreground">
        ライブラリを利用するにはログインが必要です。
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/login">
          <Button size="sm">ログイン</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline" size="sm">
            新規登録
          </Button>
        </Link>
      </div>
    </Container>
  );

  const exportHref = tokens?.accessToken
    ? `${API_BASE_URL}/api/v1/export/likes.csv?access_token=${encodeURIComponent(
        tokens.accessToken
      )}`
    : `${API_BASE_URL}/api/v1/export/likes.csv`;

  return (
    <RequireAuth loading={loadingNode} fallback={fallbackNode}>
      <Container className="py-8">
        <div className="space-y-6">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Liked Tracks Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-bold">お気に入りライブラリ</h2>
                <p className="text-muted-foreground">
                  {likedTracks.length > 0
                    ? `${likedTracks.length} 曲のお気に入り楽曲`
                    : "お気に入りの楽曲はまだありません"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isAuthenticated &&
                user &&
                likedTracks.length > 0 &&
                tokens?.accessToken && (
                  <a
                    href={exportHref}
                    download="otodoki2-likes.csv"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-2"
                    )}
                  >
                    <Download className="h-4 w-4" />
                    CSVでエクスポート
                  </a>
                )}
              {likedTracks.length > TRACK_LIMIT && (
                <Link href="/collection/liked" passHref>
                  <Button variant="ghost" className="h-auto p-0 text-sm">
                    すべて見る
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void loadTracks();
                }}
                className="gap-2"
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4" />
                更新
              </Button>
              {likedTracks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void handleClearAll();
                  }}
                  className="gap-2 text-destructive hover:bg-destructive/10"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  すべて削除
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          ) : likedTracks.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  お気に入りはまだありません
                </h3>
                <p className="text-muted-foreground mb-4">
                  スワイプページで楽曲を右にスワイプしてお気に入りを追加しましょう
                </p>
                <Link href="/swipe">
                  <Button className="gap-2">
                    <Heart className="h-4 w-4" />
                    楽曲を探す
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {likedTracks.slice(0, TRACK_LIMIT).map((track, index) => (
                <div key={`${track.id}-${index}`} className="relative group">
                  <PlayableTrackCard track={track} className="h-full" />

                  {/* Remove button overlay */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      void handleRemoveTrack(track.id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3" />
                    削除
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Disliked Tracks Section */}
          <div className="space-y-4 pt-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ThumbsDown className="h-8 w-8 text-gray-500" />
                <div>
                  <h2 className="text-2xl font-bold">スキップした楽曲</h2>
                  <p className="text-muted-foreground">
                    {dislikedTracks.length > 0
                      ? `${dislikedTracks.length} 曲のスキップ楽曲`
                      : "スキップした楽曲はまだありません"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {dislikedTracks.length > TRACK_LIMIT && (
                  <Link href="/collection/disliked" passHref>
                    <Button variant="ghost" className="h-auto p-0 text-sm">
                      すべて見る
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {dislikedTracks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void handleClearDislikedTracks();
                    }}
                    className="gap-2 text-destructive hover:bg-destructive/10"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                    すべて削除
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">読み込み中...</p>
              </div>
            ) : dislikedTracks.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <ThumbsDown className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    スキップした楽曲はありません
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    スワイプページで楽曲を左にスワイプしてスキップしましょう
                  </p>
                  <Link href="/swipe">
                    <Button className="gap-2">
                      <ThumbsDown className="h-4 w-4" />
                      楽曲を探す
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {dislikedTracks.slice(0, TRACK_LIMIT).map((track, index) => (
                  <div key={`${track.id}-${index}`} className="relative group">
                    <PlayableTrackCard track={track} className="h-full" />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        void handleRemoveDislikedTrack(track.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                      disabled={loading}
                    >
                      <RotateCcw className="h-3 w-3" />
                      解除
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation back */}
          <div className="text-center pt-8">
            <Link href="/">
              <Button variant="outline">ホームに戻る</Button>
            </Link>
          </div>
        </div>
      </Container>
    </RequireAuth>
  );
}
