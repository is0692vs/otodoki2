/**
 * TrackCard component for displaying track information
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Track } from '../types/api';

interface TrackCardProps {
  track: Track;
  onPlayToggle?: () => void;
  isPlaying?: boolean;
  isLoading?: boolean;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.85;

export default function TrackCard({
  track,
  onPlayToggle,
  isPlaying = false,
  isLoading = false,
  style,
}: TrackCardProps) {
  const hasPreview = Boolean(track.preview_url);

  return (
    <View style={[styles.container, style]}>
      {/* Album Artwork */}
      <View style={styles.artworkContainer}>
        {track.artwork_url ? (
          <Image
            source={{ uri: track.artwork_url }}
            style={styles.artwork}
            contentFit="cover"
            placeholder="🎵"
          />
        ) : (
          <View style={styles.placeholderArtwork}>
            <Text style={styles.placeholderText}>🎵</Text>
          </View>
        )}
        
        {/* Play/Pause Button Overlay */}
        {hasPreview && (
          <TouchableOpacity
            style={styles.playButton}
            onPress={onPlayToggle}
            disabled={isLoading}
          >
            <Text style={styles.playButtonText}>
              {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Track Information */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {track.title || 'タイトル不明'}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist || 'アーティスト不明'}
        </Text>
        {track.album && (
          <Text style={styles.album} numberOfLines={1}>
            {track.album}
          </Text>
        )}
        {track.genre && (
          <Text style={styles.genre} numberOfLines={1}>
            {track.genre}
          </Text>
        )}
        {!hasPreview && (
          <Text style={styles.noPreview}>プレビューなし</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  artworkContainer: {
    position: 'relative',
    aspectRatio: 1,
    width: '100%',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  placeholderArtwork: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 60,
  },
  playButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 20,
  },
  info: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  artist: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  album: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  genre: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
  },
  noPreview: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 8,
    fontStyle: 'italic',
  },
});