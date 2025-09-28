/**
 * TrackCard コンポーネントの使用例
 * 
 * このファイルは実際のアプリケーションには含まれませんが、
 * TrackCardコンポーネントの使用方法を示すための例です。
 */

import React from "react";
import { TrackCard, dummyTracks, Track } from "./TrackCard";

// 使用例1: ダミーデータを使用
export function TrackCardDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {dummyTracks.map((track) => (
        <TrackCard key={track.id} track={track} />
      ))}
    </div>
  );
}

// 使用例2: カスタムデータを使用
export function CustomTrackCardDemo() {
  const customTrack: Track = {
    id: "custom-1",
    title: "カスタム楽曲",
    artist: "カスタムアーティスト",
    artwork_url: "https://via.placeholder.com/300x300/purple/white?text=Custom",
    album: "カスタムアルバム",
    duration_ms: 180000,
    genre: "J-Pop"
  };

  return (
    <div className="max-w-sm">
      <TrackCard track={customTrack} />
    </div>
  );
}

// 使用例3: アートワークなしの楽曲
export function NoArtworkTrackDemo() {
  const trackWithoutArtwork: Track = {
    id: "no-artwork",
    title: "アートワークなし楽曲",
    artist: "未知のアーティスト"
  };

  return (
    <div className="max-w-sm">
      <TrackCard track={trackWithoutArtwork} />
    </div>
  );
}