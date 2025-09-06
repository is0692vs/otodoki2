"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/Container";
import { TrackCard } from "@/components/TrackCard";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, RotateCcw, ThumbsDown, ChevronRight } from "lucide-react";
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

// StoredTrack type definition (for liked tracks)
interface StoredTrack {
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
interface StoredDislikedTrack {
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
function storedTrackToTrack(storedTrack: StoredTrack): Track {
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

function storedDislikedTrackToTrack(storedDislikedTrack: StoredDislikedTrack): Track {
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

export default function Library() {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [dislikedTracks, setDislikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const TRACK_LIMIT = 10;

  const loadLikedTracks = () => {
    setLoading(true); // Assuming loading state is shared for both lists
    const stored = getLikedTracks();
    const tracks = stored.map(storedTrackToTrack);
    setLikedTracks(tracks);
    setLoading(false);
  };

  const loadDislikedTracks = () => {
    setLoading(true); // Assuming loading state is shared for both lists
    const stored = getDislikedTracks();
    const tracks = stored.map(storedDislikedTrackToTrack);
    setDislikedTracks(tracks);
    setLoading(false);
  };

  useEffect(() => {
    loadLikedTracks();
    loadDislikedTracks();
  }, []);

  const handleRemoveTrack = (trackId: string | number) => {
    const success = removeLikedTrack(trackId);
    if (success) {
      loadLikedTracks(); // Reload the list
      console.log(`🗑️ Removed track from library: ${trackId}`);
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        "すべてのお気に入り楽曲を削除しますか？この操作は元に戻せません。"
      )
    ) {
      const success = clearLikedTracks();
      if (success) {
        setLikedTracks([]);
        console.log("🗑️ Cleared all liked tracks");
      }
    }
  };

  const handleRemoveDislikedTrack = (trackId: string | number) => {
    const success = removeDislikedTrack(trackId);
    if (success) {
      loadDislikedTracks(); // Reload the list
      console.log(`🗑️ Removed disliked track from library: ${trackId}`);
    }
  };

  const handleClearDislikedTracks = () => {
    if (
      confirm(
        "すべてのスキップ楽曲を削除しますか？この操作は元に戻せません。"
      )
    ) {
      const success = clearDislikedTracks();
      if (success) {
        setDislikedTracks([]);
        console.log("🗑️ Cleared all disliked tracks");
      }
    }
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold">お気に入りライブラリ</h1>
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
              onClick={loadLikedTracks}
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

        {/* Content */}
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
                <TrackCard track={track} className="h-full" />

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
        <div className="space-y-6 pt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ThumbsDown className="h-8 w-8 text-gray-500" />
              <div>
                <h1 className="text-3xl font-bold">スキップした楽曲</h1>
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

          {dislikedTracks.length === 0 ? (
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
                  <TrackCard track={track} className="h-full" />
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
  );
}
