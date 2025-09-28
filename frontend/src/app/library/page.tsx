"use client";

import { useState, useEffect, useCallback } from "react";
import { Container } from "@/components/Container";
import { RequireAuth } from "@/components/RequireAuth";
import { PlayableTrackCard } from "@/components/PlayableTrackCard";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Trash2,
  RotateCcw,
  ThumbsDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  getLikedTracks,
  removeLikedTrack,
  clearLikedTracks,
  getDislikedTracks,
  removeDislikedTrack,
  clearDislikedTracks,
} from "@/lib/storage";
import { Track } from "@/services/types";
import { storedTrackToTrack, storedDislikedTrackToTrack } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Library() {
  const { isAuthenticated } = useAuth();
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [dislikedTracks, setDislikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const TRACK_LIMIT = 12;

  const loadTracks = useCallback(() => {
    setLoading(true);
    const storedLiked = getLikedTracks();
    setLikedTracks(storedLiked.map(storedTrackToTrack));
    const storedDisliked = getDislikedTracks();
    setDislikedTracks(storedDisliked.map(storedDislikedTrackToTrack));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLikedTracks([]);
      setDislikedTracks([]);
      setLoading(false);
      return;
    }
    loadTracks();
  }, [loadTracks, isAuthenticated]);

  const handleRemoveTrack = (trackId: string | number) => {
    if (removeLikedTrack(trackId)) {
      loadTracks();
      console.log(`🗑️ Removed track from library: ${trackId}`);
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        "すべてのお気に入り楽曲を削除しますか？この操作は元に戻せません。"
      )
    ) {
      if (clearLikedTracks()) {
        setLikedTracks([]);
        console.log("🗑️ Cleared all liked tracks");
      }
    }
  };

  const handleRemoveDislikedTrack = (trackId: string | number) => {
    if (removeDislikedTrack(trackId)) {
      loadTracks();
      console.log(`🗑️ Removed disliked track from library: ${trackId}`);
    }
  };

  const handleClearDislikedTracks = () => {
    if (
      confirm("すべてのスキップ楽曲を削除しますか？この操作は元に戻せません。")
    ) {
      if (clearDislikedTracks()) {
        setDislikedTracks([]);
        console.log("🗑️ Cleared all disliked tracks");
      }
    }
  };

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

  return (
    <RequireAuth loading={loadingNode} fallback={fallbackNode}>
      <Container className="py-8">
        <div className="space-y-6">
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
                onClick={loadTracks}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                更新
              </Button>
              {likedTracks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="gap-2 text-destructive hover:bg-destructive/10"
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
                    onClick={() => handleRemoveTrack(track.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
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
                    onClick={handleClearDislikedTracks}
                    className="gap-2 text-destructive hover:bg-destructive/10"
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
                      onClick={() => handleRemoveDislikedTrack(track.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
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
