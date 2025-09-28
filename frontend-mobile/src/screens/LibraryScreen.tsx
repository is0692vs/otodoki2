import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {api} from '../services';
import {useAuth} from '../contexts';
import {Track, EvaluationResponse} from '../types';

export default function LibraryScreen() {
  const {isAuthenticated} = useAuth();
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [dislikedTracks, setDislikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'liked' | 'disliked'>('liked');
  const TRACK_LIMIT = 20;

  const loadTracks = async () => {
    if (!isAuthenticated) {
      setLikedTracks([]);
      setDislikedTracks([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [likedRes, dislikedRes] = await Promise.all([
        api.evaluations.list({status: 'like', limit: 200, offset: 0}),
        api.evaluations.list({status: 'dislike', limit: 200, offset: 0}),
      ]);

      let nextError: string | null = null;

      if (likedRes.data) {
        const tracks: Track[] = likedRes.data.items
          .filter((item: EvaluationResponse) => item.track)
          .map((item: EvaluationResponse) => ({
            id: item.track!.external_id,
            title: item.track!.title || '不明な楽曲',
            artist: item.track!.artist || '不明なアーティスト',
            album: item.track!.album,
            artwork_url: item.track!.artwork_url,
            preview_url: item.track!.preview_url,
            genre: item.track!.primary_genre,
            duration_ms: item.track!.duration_ms,
          }));
        setLikedTracks(tracks);
      } else {
        nextError = likedRes.error?.detail || likedRes.error?.error || 'いいねした楽曲の取得に失敗しました';
      }

      if (dislikedRes.data) {
        const tracks: Track[] = dislikedRes.data.items
          .filter((item: EvaluationResponse) => item.track)
          .map((item: EvaluationResponse) => ({
            id: item.track!.external_id,
            title: item.track!.title || '不明な楽曲',
            artist: item.track!.artist || '不明なアーティスト',
            album: item.track!.album,
            artwork_url: item.track!.artwork_url,
            preview_url: item.track!.preview_url,
            genre: item.track!.primary_genre,
            duration_ms: item.track!.duration_ms,
          }));
        setDislikedTracks(tracks);
      } else if (!nextError) {
        nextError = dislikedRes.error?.detail || dislikedRes.error?.error || 'スキップした楽曲の取得に失敗しました';
      }

      if (nextError) {
        setError(nextError);
      }
    } catch (err) {
      setError(`エラーが発生しました: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, [isAuthenticated]);

  const handleRemoveTrack = async (trackId: string, type: 'liked' | 'disliked') => {
    try {
      const response = await api.evaluations.delete(trackId);
      if (response.error) {
        Alert.alert('エラー', response.error.detail || response.error.error);
        return;
      }

      if (type === 'liked') {
        setLikedTracks(prev => prev.filter(track => track.id.toString() !== trackId));
      } else {
        setDislikedTracks(prev => prev.filter(track => track.id.toString() !== trackId));
      }

      Alert.alert('成功', '楽曲の評価を解除しました');
    } catch (error) {
      Alert.alert('エラー', '楽曲の削除に失敗しました');
    }
  };

  const renderTrackCard = (track: Track, type: 'liked' | 'disliked') => (
    <View key={track.id} style={styles.trackCard}>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {track.artist}
        </Text>
        {track.album && (
          <Text style={styles.trackAlbum} numberOfLines={1}>
            {track.album}
          </Text>
        )}
        {track.genre && (
          <View style={styles.genreContainer}>
            <Text style={styles.genreText}>{track.genre}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveTrack(track.id.toString(), type)}
      >
        <Text style={styles.removeButtonText}>解除</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.unauthenticatedContainer}>
        <Text style={styles.unauthenticatedTitle}>ログインが必要です</Text>
        <Text style={styles.unauthenticatedText}>
          ライブラリを表示するにはログインしてください
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
          onPress={() => setActiveTab('liked')}
        >
          <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>
            いいね ({likedTracks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'disliked' && styles.activeTab]}
          onPress={() => setActiveTab('disliked')}
        >
          <Text style={[styles.tabText, activeTab === 'disliked' && styles.activeTabText]}>
            スキップ ({dislikedTracks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>ライブラリを読み込み中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>エラーが発生しました</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTracks}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {activeTab === 'liked' ? (
            likedTracks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>いいねした楽曲はありません</Text>
                <Text style={styles.emptyText}>
                  スワイプページで楽曲を右にスワイプしていいねしましょう
                </Text>
              </View>
            ) : (
              <View style={styles.trackList}>
                {likedTracks.slice(0, TRACK_LIMIT).map((track) =>
                  renderTrackCard(track, 'liked')
                )}
              </View>
            )
          ) : (
            dislikedTracks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>スキップした楽曲はありません</Text>
                <Text style={styles.emptyText}>
                  スワイプページで楽曲を左にスワイプしてスキップしましょう
                </Text>
              </View>
            ) : (
              <View style={styles.trackList}>
                {dislikedTracks.slice(0, TRACK_LIMIT).map((track) =>
                  renderTrackCard(track, 'disliked')
                )}
              </View>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingHorizontal: 4,
    paddingVertical: 4,
    margin: 16,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  trackList: {
    padding: 16,
    gap: 12,
  },
  trackCard: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackInfo: {
    flex: 1,
    gap: 4,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trackArtist: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  trackAlbum: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  genreContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  genreText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 64,
    gap: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  unauthenticatedTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  unauthenticatedText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});