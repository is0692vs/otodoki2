import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import {api} from '../services';
import {useAuth} from '../contexts';
import {Track, EvaluationStatus, EvaluationTrackPayload} from '../types';

const REFILL_THRESHOLD = 5;

export default function SwipeScreen() {
  const {isAuthenticated} = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [noMoreTracks, setNoMoreTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const swiperRef = useRef<any>(null);

  const loadTracks = async (refill = false) => {
    try {
      if (refill) {
        setIsFetchingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await api.tracks.suggestions({limit: 10});
      if (response.error) {
        setError(`楽曲の取得に失敗しました: ${response.error.error}`);
        setNoMoreTracks(true);
      } else {
        const newTracks = response.data?.data || [];
        if (newTracks.length === 0) {
          setNoMoreTracks(true);
        } else {
          setTracks(prev => refill ? [...prev, ...newTracks] : newTracks);
        }
      }
    } catch (err) {
      setError(`エラーが発生しました: ${err}`);
      setNoMoreTracks(true);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, []);

  const createEvaluationPayload = (track: Track): EvaluationTrackPayload => ({
    external_id: track.id.toString(),
    source: 'mobile_app',
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork_url: track.artwork_url,
    preview_url: track.preview_url,
    primary_genre: track.genre,
    duration_ms: track.duration_ms,
  });

  const handleSwipe = async (direction: 'left' | 'right', cardIndex: number) => {
    const track = tracks[cardIndex];
    if (!track) return;

    const status: EvaluationStatus = direction === 'right' ? 'like' : 'skip';
    
    if (isAuthenticated) {
      try {
        await api.evaluations.create({
          track: createEvaluationPayload(track),
          status,
          source: 'mobile_app',
        });
      } catch (error) {
        console.warn('Failed to save evaluation:', error);
      }
    }

    // Check if we need to refill
    const remainingTracks = tracks.length - cardIndex - 1;
    if (remainingTracks <= REFILL_THRESHOLD && !isFetchingMore && !noMoreTracks) {
      loadTracks(true);
    }
  };

  const handleLike = () => {
    if (swiperRef.current) {
      swiperRef.current.swipeRight();
    }
  };

  const handleSkip = () => {
    if (swiperRef.current) {
      swiperRef.current.swipeLeft();
    }
  };

  const renderCard = (track: Track, index: number) => (
    <View key={`${track.id}-${index}`} style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        <Text style={styles.trackArtist}>{track.artist}</Text>
        {track.album && (
          <Text style={styles.trackAlbum}>{track.album}</Text>
        )}
        {track.genre && (
          <View style={styles.genreContainer}>
            <Text style={styles.genreText}>{track.genre}</Text>
          </View>
        )}
        {track.duration_ms && (
          <Text style={styles.duration}>
            {Math.floor(track.duration_ms / 60000)}:
            {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
          </Text>
        )}
      </View>
    </View>
  );

  const renderNoMoreCards = () => (
    <View style={styles.noMoreCards}>
      <Text style={styles.noMoreCardsTitle}>すべての楽曲をチェックしました！</Text>
      <Text style={styles.noMoreCardsText}>
        新しい楽曲が追加されるまでお待ちください
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadTracks()}>
        <Text style={styles.retryButtonText}>再読み込み</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && tracks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>楽曲を読み込み中...</Text>
      </View>
    );
  }

  if (error && tracks.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>エラーが発生しました</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadTracks()}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          右にスワイプでいいね！、左にスワイプでスキップ
        </Text>
      </View>

      <View style={styles.swiperContainer}>
        <Swiper
          ref={swiperRef}
          cards={tracks}
          renderCard={renderCard}
          onSwipedLeft={(index) => handleSwipe('left', index)}
          onSwipedRight={(index) => handleSwipe('right', index)}
          onSwipedAll={renderNoMoreCards}
          cardIndex={0}
          backgroundColor={'transparent'}
          stackSize={3}
          stackSeparation={15}
          animateOverlayLabelsOpacity
          animateCardOpacity
          swipeBackCard
          overlayLabels={{
            left: {
              title: 'スキップ',
              style: {
                label: {
                  backgroundColor: '#EF4444',
                  borderColor: '#EF4444',
                  color: '#FFFFFF',
                  borderWidth: 1,
                  fontSize: 18,
                  fontWeight: 'bold',
                  borderRadius: 10,
                  padding: 8,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: -30,
                },
              },
            },
            right: {
              title: 'いいね！',
              style: {
                label: {
                  backgroundColor: '#10B981',
                  borderColor: '#10B981',
                  color: '#FFFFFF',
                  borderWidth: 1,
                  fontSize: 18,
                  fontWeight: 'bold',
                  borderRadius: 10,
                  padding: 8,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: 30,
                },
              },
            },
          }}
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>スキップ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Text style={styles.likeButtonText}>いいね！</Text>
        </TouchableOpacity>
      </View>

      {isFetchingMore && (
        <View style={styles.fetchingIndicator}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.fetchingText}>さらに読み込み中...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  instructionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#1F2937',
  },
  instructionText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  swiperContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    flex: 0.8,
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    alignItems: 'center',
    gap: 16,
  },
  trackTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackArtist: {
    fontSize: 20,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 4,
  },
  trackAlbum: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  genreContainer: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  genreText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  duration: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 48,
    paddingVertical: 24,
    backgroundColor: '#1F2937',
  },
  skipButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  likeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
  },
  likeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
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
    backgroundColor: '#111827',
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
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noMoreCards: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  noMoreCardsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  noMoreCardsText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
  fetchingIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    borderRadius: 20,
  },
  fetchingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});