import { Container } from "@/components/Container";
import { SearchBar } from "@/components/SearchBar";
import { Section } from "@/components/Section";
import { MusicCard } from "@/components/MusicCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Mock data for demonstration - in a real app this would come from an API
const featuredMusic = [
  { title: "Bohemian Rhapsody", artist: "Queen", album: "A Night at the Opera" },
  { title: "Hotel California", artist: "Eagles", album: "Hotel California" },
  { title: "Imagine", artist: "John Lennon", album: "Imagine" },
  { title: "Stairway to Heaven", artist: "Led Zeppelin", album: "Led Zeppelin IV" },
];

const recentMusic = [
  { title: "Shape of You", artist: "Ed Sheeran", album: "÷ (Divide)" },
  { title: "Blinding Lights", artist: "The Weeknd", album: "After Hours" },
  { title: "Dance Monkey", artist: "Tones and I", album: "The Kids Are Coming" },
  { title: "Someone You Loved", artist: "Lewis Capaldi", album: "Divinely Uninspired to a Hellish Extent" },
];

const genres = [
  "ポップ", "ロック", "ジャズ", "クラシック", "R&B", "ヒップホップ", "エレクトロニック", "カントリー"
];

export default function Home() {
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {featuredMusic.map((music, index) => (
              <MusicCard
                key={index}
                title={music.title}
                artist={music.artist}
                album={music.album}
              />
            ))}
          </div>
        </Section>

        {/* Recent/Trending */}
        <Section title="最近人気の楽曲" showViewAll>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {recentMusic.map((music, index) => (
              <MusicCard
                key={index}
                title={music.title}
                artist={music.artist}
                album={music.album}
              />
            ))}
          </div>
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
      </div>
    </Container>
  );
}
