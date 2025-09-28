'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { TrackCard } from '@/components/TrackCard';
import { Button } from '@/components/ui/button';
import { api, type Track } from '@/services';
import { getLikedTracks, getDislikedTracks } from '@/lib/storage';
import { ArrowLeft } from 'lucide-react';
import { storedTrackToTrack, storedDislikedTrackToTrack } from '@/lib/utils';

const collectionTitles: { [key: string]: string } = {
  featured: 'おすすめの楽曲',
  trending: '最近人気の楽曲',
  liked: 'お気に入りライブラリ',
  disliked: 'スキップした楽曲',
};

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchTracks = async () => {
      setLoading(true);
      setError(null);
      try {
        let trackData: Track[] = [];
        if (slug === 'liked') {
          const stored = getLikedTracks();
          trackData = stored.map(storedTrackToTrack);
        } else if (slug === 'disliked') {
          const stored = getDislikedTracks();
          trackData = stored.map(storedDislikedTrackToTrack);
        } else {
          // For 'featured' and 'trending', fetch from API
          // We can use a larger limit here to get "all" tracks
          const response = await api.tracks.suggestions({ limit: 50 });
          if (response.error) {
            setError(response.error.error);
          } else {
            // Differentiate between featured and trending, e.g. by shuffling or slicing
            const allTracks = response.data?.data || [];
            if (slug === 'featured') {
              trackData = allTracks;
            } else if (slug === 'trending') {
              // TODO: This is a placeholder. In the future, implement a separate API endpoint
              // or logic to provide a distinct list of trending tracks.
              trackData = [...allTracks].reverse();
            }
          }
        }
        setTracks(trackData);
      } catch (err) {
        setError('楽曲の読み込みに失敗しました。');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [slug]);

  const title = collectionTitles[slug] || 'コレクション';

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/" passHref>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{tracks.length} 曲</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        ) : error ? (
           <div className="text-center py-16">
            <p className="text-destructive">{error}</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">このコレクションには楽曲がありません。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
