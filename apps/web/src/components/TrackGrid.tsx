import { TrackCard, type Track } from "@/components/TrackCard";
import { Button } from "@/components/ui/button";

interface TrackGridProps {
  tracks: Track[];
  onRemoveTrack: (trackId: string | number) => void;
  RemoveIcon: React.ReactNode;
  removeButtonVariant?: "destructive" | "secondary";
  removeButtonLabel: string;
}

export function TrackGrid({
  tracks,
  onRemoveTrack,
  RemoveIcon,
  removeButtonVariant = "destructive",
  removeButtonLabel,
}: TrackGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tracks.map((track, index) => (
        <div key={`${track.id}-${index}`} className="relative group">
          <TrackCard track={track} className="h-full" />

          {/* Remove button overlay */}
          <Button
            variant={removeButtonVariant}
            size="sm"
            onClick={() => onRemoveTrack(track.id)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
          >
            {RemoveIcon}
            {removeButtonLabel}
          </Button>
        </div>
      ))}
    </div>
  );
}
