'use client';

import { useState, useEffect } from 'react';
import { Container } from "@/components/Container";
import { SearchBar } from "@/components/SearchBar";
import { Section } from "@/components/Section";
import { TrackCard } from "@/components/TrackCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, type Track } from '@/services';

// Fallback demo tracks to show when API is unavailable
const fallbackTracks: Track[] = [
  {
    id: "demo-1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    artwork_url: "https://via.placeholder.com/300x300/1f2937/ffffff?text=Queen",
    album: "A Night at the Opera",
    duration_ms: 355000,
    genre: "Rock"
  },
  {
    id: "demo-2", 
    title: "Imagine",
    artist: "John Lennon",
    artwork_url: "https://via.placeholder.com/300x300/3b82f6/ffffff?text=Imagine",
    album: "Imagine",
    duration_ms: 183000,
    genre: "Pop"
  },
  {
    id: "demo-3",
    title: "Billie Jean",
    artist: "Michael Jackson",
    album: "Thriller",
    duration_ms: 294000,
    genre: "Pop"
  },
  {
    id: "demo-4",
    title: "Hotel California",
    artist: "Eagles", 
    artwork_url: "https://via.placeholder.com/300x300/059669/ffffff?text=Eagles",
    album: "Hotel California",
    duration_ms: 391000,
    genre: "Rock"
  }
];

const genres = [
  "ポップ", "ロック", "ジャズ", "クラシック", "R&B", "ヒップホップ", "エレクトロニック", "カントリー"
];

export default function Home() {
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured tracks
  useEffect(() => {
    const fetchFeaturedTracks = async () => {
      try {
        setLoadingFeatured(true);
        const response = await api.tracks.suggestions({ limit: 8 });
        if (response.error) {
          setError(`Featured tracks failed: ${response.error.error}`);
          // Use fallback data when API fails
          setFeaturedTracks(fallbackTracks);
        } else {
          setFeaturedTracks(response.data?.data || []);
        }
      } catch (err) {
        setError(`Featured tracks error: ${err}`);
        // Use fallback data when API fails
        setFeaturedTracks(fallbackTracks);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchFeaturedTracks();
  }, []);

  // Fetch recent tracks (different set)
  useEffect(() => {
    const fetchRecentTracks = async () => {
      try {
        setLoadingRecent(true);
        // Use different parameters to get a different set of tracks
        const response = await api.tracks.suggestions({ limit: 6 });
        if (response.error) {
          setError(`Recent tracks failed: ${response.error.error}`);
          // Use fallback data when API fails
          setRecentTracks(fallbackTracks.slice(1, 3)); // Different subset
        } else {
          // Take a different slice or shuffle to get variety
          const tracks = response.data?.data || [];
          setRecentTracks(tracks.slice(-6)); // Take last 6 to get different tracks
        }
      } catch (err) {
        setError(`Recent tracks error: ${err}`);
        // Use fallback data when API fails
        setRecentTracks(fallbackTracks.slice(1, 3)); // Different subset
      } finally {
        setLoadingRecent(false);
      }
    };

    // Delay the second request slightly to avoid hitting rate limits
    const timer = setTimeout(fetchRecentTracks, 500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Container className="py-8">
      <div className="space-y-8">
        {/* Header and Search */}
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">音楽を発見</h1>
            <p className="text-muted-foreground">
              新しいアーティストや楽曲を見つけて、あなたの音楽体験を広げましょう
            </p>
          </div>
          <div className="flex justify-center">
            <SearchBar />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Genre Categories */}
        <Section title="ジャンル">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {genres.map((genre) => (
              <Button
                key={genre}
                variant="outline"
                className="h-12 text-sm"
              >
                {genre}
              </Button>
            ))}
          </div>
        </Section>

        {/* Featured Music */}
        <Section title="おすすめの楽曲" showViewAll>
          {loadingFeatured ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">楽曲を読み込み中...</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredTracks.slice(0, 4).map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Recent/Trending */}
        <Section title="最近人気の楽曲" showViewAll>
          {loadingRecent ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">楽曲を読み込み中...</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentTracks.slice(0, 4).map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>音楽ライブラリを始めよう</CardTitle>
            <CardDescription>
              お気に入りの楽曲を保存して、プレイリストを作成しましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button>ライブラリを見る</Button>
              <Button variant="outline">プレイリストを作成</Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-4">
          <Button size="lg">今すぐ始める</Button>
          <Button variant="secondary" size="lg">
            詳しく見る
          </Button>
          <Link href="/swipe">
            <Button variant="outline" size="lg">
              楽曲スワイプ
            </Button>
          </Link>
          <Link href="/api-demo">
            <Button variant="outline" size="lg">
              API Demo
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
