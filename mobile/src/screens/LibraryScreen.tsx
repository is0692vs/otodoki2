/**
 * Library screen for viewing liked and disliked tracks
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api-client';
import { Track, EvaluationResponse, EvaluationStatus } from '../types/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import TrackCard from '../components/TrackCard';

const { width: screenWidth } = Dimensions.get('window');

const TRACK_LIMIT = 50;
const FALLBACK_TITLE = 'タイトル情報なし';
const FALLBACK_ARTIST = 'アーティスト情報なし';

function evaluationToTrack(evaluation: EvaluationResponse): Track {
  return {
    id: evaluation.external_track_id,
    title: evaluation.track?.title || FALLBACK_TITLE,
    artist: evaluation.track?.artist || FALLBACK_ARTIST,
    album: evaluation.track?.album || undefined,
    artwork_url: evaluation.track?.artwork_url || undefined,
    preview_url: evaluation.track?.preview_url || undefined,
    genre: evaluation.track?.primary_genre || undefined,
    duration_ms: evaluation.track?.duration_ms || undefined,
  };
}

function mapEvaluationsToTracks(items?: EvaluationResponse[]): Track[] {
  if (!items) return [];
  return items.map(evaluationToTrack);
}

export default function LibraryScreen() {
  const [selectedTab, setSelectedTab] = useState<'like' | 'dislike'>('like');
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [dislikedTracks, setDislikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  const [audioState, audioActions] = useAudioPlayer({
    autoPlay: false,
    onPlaybackError: (error, track) => {
      console.warn('Playback error:', error, track);
    },
  });

  const loadEvaluations = useCallback(async (status: EvaluationStatus, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.evaluations.list({
        status,
        limit: TRACK_LIMIT,
        offset: 0,
      });

      if (response.error) {
        throw new Error(response.error.error);
      }

      const tracks = mapEvaluationsToTracks(response.data?.items);
      
      if (status === 'like') {
        setLikedTracks(tracks);
      } else {
        setDislikedTracks(tracks);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'データの取得に失敗しました';
      Alert.alert('エラー', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadAllEvaluations = useCallback(async (isRefresh = false) => {
    await Promise.all([
      loadEvaluations('like', isRefresh),
      loadEvaluations('dislike', isRefresh),
    ]);
  }, [loadEvaluations]);

  const handleRemoveDislikedTrack = useCallback(async (trackId: string | number) => {
    try {
      await api.evaluations.delete(String(trackId));
      setDislikedTracks(prev => prev.filter(track => track.id !== trackId));
      Alert.alert('成功', 'スキップした楽曲を解除しました');
    } catch (error) {
      Alert.alert('エラー', '解除に失敗しました');
    }
  }, []);

  const handlePlayToggle = useCallback((track: Track) => {
    if (audioState.isPlaying && audioState.currentTrack?.id === track.id) {
      audioActions.pause();
    } else {
      audioActions.play(track);
    }
  }, [audioState.isPlaying, audioState.currentTrack, audioActions]);

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'ログアウト', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    loadAllEvaluations(true);
  }, [loadAllEvaluations]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllEvaluations();
    }
  }, [isAuthenticated, loadAllEvaluations]);

  const currentTracks = selectedTab === 'like' ? likedTracks : dislikedTracks;
  const isEmpty = currentTracks.length === 0;

  const renderTrackItem = ({ item: track, index }: { item: Track; index: number }) => {
    const isCurrentPlaying = audioState.isPlaying && audioState.currentTrack?.id === track.id;
    
    return (
      <View style={styles.trackItem}>
        <TrackCard
          track={track}
          onPlayToggle={() => handlePlayToggle(track)}
          isPlaying={isCurrentPlaying}
          isLoading={audioState.isLoading && audioState.currentTrack?.id === track.id}
          style={styles.trackCard}
        />
        {selectedTab === 'dislike' && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveDislikedTrack(track.id)}
          >
            <Text style={styles.removeButtonText}>解除</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (selectedTab === 'like') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>お気に入りの楽曲はありません</Text>
          <Text style={styles.emptySubtitle}>
            スワイプページで楽曲を右にスワイプしてお気に入りに追加しましょう
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>スキップした楽曲はありません</Text>
          <Text style={styles.emptySubtitle}>
            スワイプページで楽曲を左にスワイプしてスキップしましょう
          </Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ライブラリ</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>ログアウト</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'like' && styles.activeTab]}
          onPress={() => setSelectedTab('like')}
        >
          <Text style={[styles.tabText, selectedTab === 'like' && styles.activeTabText]}>
            お気に入り ({likedTracks.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'dislike' && styles.activeTab]}
          onPress={() => setSelectedTab('dislike')}
        >
          <Text style={[styles.tabText, selectedTab === 'dislike' && styles.activeTabText]}>
            スキップ ({dislikedTracks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Track List */}
      <FlatList
        data={currentTracks}
        renderItem={renderTrackItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listContainer,
          isEmpty && styles.emptyListContainer,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        numColumns={1}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ff4757',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  trackItem: {
    position: 'relative',
    marginBottom: 20,
    alignItems: 'center',
  },
  trackCard: {
    width: screenWidth * 0.9,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 71, 87, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});