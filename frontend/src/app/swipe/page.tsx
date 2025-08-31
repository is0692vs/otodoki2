'use client';

import { useState, useEffect } from 'react';
import { Container } from "@/components/Container";
import { SwipeStack } from "@/components/SwipeStack";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, type Track } from '@/services';

// Fallback demo tracks for when API is unavailable
const fallbackTracks: Track[] = [
  {
    id: "swipe-1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    artwork_url: "https://via.placeholder.com/300x300/1f2937/ffffff?text=Queen",
    album: "A Night at the Opera",
    duration_ms: 355000,
    genre: "Rock"
  },
  {
    id: "swipe-2", 
    title: "Imagine",
    artist: "John Lennon",
    artwork_url: "https://via.placeholder.com/300x300/3b82f6/ffffff?text=Imagine",
    album: "Imagine",
    duration_ms: 183000,
    genre: "Pop"
  },
  {
    id: "swipe-3",
    title: "Billie Jean",
    artist: "Michael Jackson",
    artwork_url: "https://via.placeholder.com/300x300/8b5cf6/ffffff?text=MJ",
    album: "Thriller",
    duration_ms: 294000,
    genre: "Pop"
  },
  {
    id: "swipe-4",
    title: "Hotel California",
    artist: "Eagles", 
    artwork_url: "https://via.placeholder.com/300x300/059669/ffffff?text=Eagles",
    artist: "Eagles",
    artwork_url: "https://via.placeholder.com/300x300/f59e0b/ffffff?text=Eagles",
    album: "Hotel California",
    duration_ms: 391000,
    genre: "Rock"
  },
  {
    id: "swipe-5",
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    artwork_url: "https://via.placeholder.com/300x300/ef4444/ffffff?text=LZ",
    album: "Led Zeppelin IV",
    duration_ms: 482000,
    genre: "Rock"
  }
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
        const response = await api.tracks.suggestions({ limit: 20 });
        if (response.error) {
          setError(`Failed to load tracks: ${response.error.error}`);
          // Use fallback data when API fails
          setTracks(fallbackTracks);
        } else {
          const apiTracks = response.data?.data || [];
          // Mix API tracks with fallback tracks for better demo
          setTracks([...apiTracks, ...fallbackTracks].slice(0, 20));
        }
      } catch (err) {
        setError(`Error loading tracks: ${err}`);
        // Use fallback data when API fails
        setTracks(fallbackTracks);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  const handleSwipe = (direction: 'left' | 'right', track: Track) => {
    console.log(`Swiped ${direction} on track:`, track.title);
    // Here you could implement logic to save likes/dislikes
    if (direction === 'right') {
      // Track liked
    } else {
      // Track disliked
    }
  };

  const handleStackEmpty = () => {
    console.log('All tracks swiped! Loading more...');
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
          <div /> {/* Spacer for alignment */}
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
            <p className="text-orange-500 text-xs mt-1">フォールバックデータを使用しています</p>

            カードを左右にスワイプして楽曲を評価してください
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <span className="text-red-500">← 嫌い</span>
            <span className="text-green-500">好き →</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center">
            <p className="text-amber-600 text-sm">{error}</p>
            <p className="text-muted-foreground text-sm">デモ楽曲を表示しています</p>
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