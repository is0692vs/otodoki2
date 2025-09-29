/**
 * Swipe screen for evaluating tracks
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api-client';
import { Track, EvaluationStatus } from '../types/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import TrackCard from '../components/TrackCard';
import LoadingScreen from './LoadingScreen';

// Instruction card for first-time users
const instructionCard: Track = {
  id: 'instruction',
  title: '使い方',
  artist: 'otodoki2',
  album: 'ボタンを押して評価しましょう',
};

export default function SwipeScreen() {
  const [tracks, setTracks] = useState<Track[]>([instructionCard]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [noMoreTracks, setNoMoreTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated } = useAuth();
  const evaluatedTrackIdsRef = useRef<Set<string>>(new Set());
  
  const [audioState, audioActions] = useAudioPlayer({
    autoPlay: false,
    onTrackEnd: () => {
      // Auto-advance to next track when current one ends
      if (currentIndex < tracks.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    onPlaybackError: (error, track) => {
      console.warn('Playback error:', error, track);
    },
  });

  // Fetch initial tracks
  const fetchInitialTracks = useCallback(async () => {
    setLoading(true);
    setNoMoreTracks(false);
    setError(null);
    
    try {
      const response = await api.tracks.suggestions({
        limit: 20,
        excludeIds: Array.from(evaluatedTrackIdsRef.current).join(','),
      });
      
      if (response.error) {
        throw new Error(response.error.error);
      }

      const apiTracks = response.data?.data || [];
      const filteredApiTracks = apiTracks.filter((track) => {
        const trackId = String(track.id);
        return !evaluatedTrackIdsRef.current.has(trackId);
      });

      console.log(`📱 Loaded ${filteredApiTracks.length} initial tracks.`);
      setTracks([instructionCard, ...filteredApiTracks]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error loading tracks: ${errorMessage}`);
      // Use instruction card as fallback
      setTracks([instructionCard]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch more tracks
  const fetchMoreTracks = useCallback(async () => {
    if (isFetchingMore || noMoreTracks || loading) return;

    setIsFetchingMore(true);
    console.log('[FETCH] Starting to fetch more tracks...');
    
    try {
      const existingIds = new Set(
        tracks.map((t) => t.id).filter((id) => !isNaN(Number(id)))
      );
      const excludeIds = Array.from(
        new Set([
          ...evaluatedTrackIdsRef.current,
          ...Array.from(existingIds).map((id) => String(id)),
        ])
      ).join(',');

      const response = await api.tracks.suggestions({ limit: 10, excludeIds });
      
      if (response.error) {
        throw new Error(response.error.error);
      }

      const newApiTracks = response.data?.data || [];
      
      if (newApiTracks.length === 0) {
        console.log('[FETCH] No more tracks returned from API.');
        setNoMoreTracks(true);
        return;
      }

      const filteredNewTracks = newApiTracks.filter((track) => {
        const trackId = String(track.id);
        return !evaluatedTrackIdsRef.current.has(trackId);
      });

      console.log(`[FETCH] Added ${filteredNewTracks.length} new tracks.`);
      setTracks((prev) => [...prev, ...filteredNewTracks]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[FETCH] Error fetching more tracks:', errorMessage);
      setNoMoreTracks(true);
    } finally {
      setIsFetchingMore(false);
    }
  }, [tracks, isFetchingMore, noMoreTracks, loading]);

  // Load evaluated tracks on mount
  const syncEvaluatedTracks = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const pageSize = 100;
      let offset = 0;
      const nextSet = new Set<string>();

      while (true) {
        const response = await api.evaluations.list({
          limit: pageSize,
          offset,
        });
        
        if (response.error) {
          console.warn('Failed to load evaluations', response.error);
          break;
        }

        const items = response.data?.items ?? [];
        items.forEach((item) => {
          nextSet.add(item.external_track_id);
        });

        if (items.length < pageSize) {
          break;
        }
        offset += pageSize;
      }

      console.log(`📱 Loaded ${nextSet.size} evaluated track IDs.`);
      evaluatedTrackIdsRef.current = nextSet;
    } catch (error) {
      console.warn('Failed to sync evaluated tracks:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    syncEvaluatedTracks().then(() => {
      fetchInitialTracks();
    });
  }, [syncEvaluatedTracks, fetchInitialTracks]);

  // Handle play/pause
  const handlePlayToggle = () => {
    const currentTrack = tracks[currentIndex];
    if (!currentTrack || currentTrack.id === 'instruction') return;

    if (audioState.isPlaying && audioState.currentTrack?.id === currentTrack.id) {
      audioActions.pause();
    } else {
      audioActions.play(currentTrack);
    }
  };

  // Handle evaluation
  const handleEvaluation = useCallback(async (status: EvaluationStatus) => {
    const currentTrack = tracks[currentIndex];
    
    if (currentTrack && currentTrack.id !== 'instruction') {
      // Add to evaluated tracks
      evaluatedTrackIdsRef.current.add(String(currentTrack.id));
      
      if (isAuthenticated) {
        try {
          await api.evaluations.create({
            track: {
              external_id: String(currentTrack.id),
              title: currentTrack.title,
              artist: currentTrack.artist,
              album: currentTrack.album,
              artwork_url: currentTrack.artwork_url,
              preview_url: currentTrack.preview_url,
              primary_genre: currentTrack.genre,
              duration_ms: currentTrack.duration_ms,
            },
            status,
            source: 'mobile_button',
          });
        } catch (error) {
          console.warn('Failed to save evaluation:', error);
        }
      }
    }

    // Move to next track
    setCurrentIndex(currentIndex + 1);
    
    // Fetch more tracks if needed
    if (currentIndex >= tracks.length - 3 && !isFetchingMore && !noMoreTracks) {
      fetchMoreTracks();
    }
  }, [currentIndex, tracks, isAuthenticated, isFetchingMore, noMoreTracks, fetchMoreTracks]);

  // Manual evaluation buttons
  const handleLike = () => {
    handleEvaluation('like');
  };

  const handleDislike = () => {
    handleEvaluation('dislike');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (currentIndex >= tracks.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.endContainer}>
          <Text style={styles.endTitle}>お疲れさまでした！</Text>
          <Text style={styles.endSubtitle}>新しい楽曲が追加されるまでお待ちください</Text>
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          <TouchableOpacity style={styles.refreshButton} onPress={fetchInitialTracks}>
            <Text style={styles.refreshButtonText}>リフレッシュ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentTrack = tracks[currentIndex];
  const isCurrentPlaying = audioState.isPlaying && audioState.currentTrack?.id === currentTrack.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>otodoki2</Text>
        <Text style={styles.headerSubtitle}>
          {currentIndex + 1} / {tracks.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <TrackCard
          track={currentTrack}
          onPlayToggle={handlePlayToggle}
          isPlaying={isCurrentPlaying}
          isLoading={audioState.isLoading}
        />
      </View>

      {currentTrack.id !== 'instruction' && (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlButton, styles.dislikeButton]} onPress={handleDislike}>
            <Text style={styles.controlButtonText}>✗</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.controlButton, styles.likeButton]} onPress={handleLike}>
            <Text style={styles.controlButtonText}>♥</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 50,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dislikeButton: {
    backgroundColor: '#ef4444',
  },
  likeButton: {
    backgroundColor: '#22c55e',
  },
  controlButtonText: {
    fontSize: 36,
  },
  endContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  endTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  endSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    color: '#ff4757',
    textAlign: 'center',
    fontSize: 14,
  },
});