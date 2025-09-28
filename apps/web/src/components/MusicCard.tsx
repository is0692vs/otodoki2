import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Heart } from "lucide-react";
import Image from "next/image";

interface MusicCardProps {
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string;
}

export function MusicCard({ title, artist, album, imageUrl }: MusicCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${title} by ${artist}`}
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="text-muted-foreground">♪</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{title}</CardTitle>
            <CardDescription className="truncate">{artist}</CardDescription>
            {album && (
              <CardDescription className="text-xs truncate">{album}</CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Play className="h-4 w-4" />
              <span className="sr-only">再生</span>
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Heart className="h-4 w-4" />
              <span className="sr-only">お気に入り</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}