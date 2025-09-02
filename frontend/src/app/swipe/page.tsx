"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { SwipeStack } from "@/components/SwipeStack";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSwipeDeck } from "@/hooks/useSwipeDeck";
import type { Track } from "@/services";

// Static definition for the instruction card
const instructionCard: Track = {
  id: "instruction-card",
  title: "スワイプして始めよう",
  artist: "左右にスワイプして、好きな曲を見つけよう！",
  artwork_url: "/file.svg", // Using a placeholder icon
  preview_url: "",
  album: "ルール説明",
  duration_ms: 0,
  genre: "Tutorial",
};

export default function SwipePage() {
  const {
    visibleTracks,
    handleSwipe,
    isFetching,
    fetchError,
  } = useSwipeDeck();

  const [showInstructionCard, setShowInstructionCard] = useState(true);

  // The swipe handler passed to the stack needs to differentiate
  // between the instruction card and actual tracks.
  const handleSwipeWrapper = (direction: "left" | "right", track: Track) => {
    if (track.id === instructionCard.id) {
      setShowInstructionCard(false);
      return; // Don't call the hook's handler for the instruction card
    }
    // For all other cards, use the handler from our hook
    handleSwipe(direction, track);
  };

  // Memoize the list of tracks to be rendered.
  // It's either the instruction card + real tracks, or just real tracks.
  const tracksToRender = useMemo(() => {
    return showInstructionCard
      ? [instructionCard, ...visibleTracks]
      : visibleTracks;
  }, [showInstructionCard, visibleTracks]);

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
          <div className="w-20" /> {/* Spacer for center alignment */}
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            楽曲をスワイプして好みを設定しましょう
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              好みではない
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              好み
            </span>
          </div>
        </div>

        {/* Error Display */}
        {fetchError && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-600 text-sm font-semibold">
              エラーが発生しました
            </p>
            <p className="text-orange-500 text-xs mt-1">{fetchError}</p>
          </div>
        )}

        {/* Swipe Stack */}
        <div className="h-[600px] flex items-center justify-center">
          {isFetching && tracksToRender.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">新しい楽曲を探しています...</p>
            </div>
          ) : (
            <SwipeStack
              tracks={tracksToRender}
              onSwipe={handleSwipeWrapper}
            />
          )}
        </div>
      </div>
    </Container>
  );
}
