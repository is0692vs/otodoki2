/**
 * Home screen component - Main landing page for the mobile app
 * Based on frontend/src/app/page.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { api } from '../services/api-client';
import { Track } from '../types/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import TrackCard from '../components/TrackCard';
import { MainTabParamList } from '../navigation/Navigation';
import LoadingScreen from './LoadingScreen';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

const { width: screenWidth } = Dimensions.get('window');
const trackCardWidth = screenWidth * 0.42; // For grid layout

// Genre list matching web version
const genres = [
  'ポップ',
  'ロック',
  'ジャズ',
  'クラシック',
  'R&B',
  'ヒップホップ',
  'エレクトロニック',
  'カントリー',
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { audioState, audioActions } = useAudioPlayer();
  
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch featured tracks
  const fetchFeaturedTracks = async () => {
    try {
      setLoadingFeatured(true);
      setError(null);
      const response = await api.tracks.suggestions({ limit: 8 });
      if (response.error) {
        setError(`おすすめ楽曲の取得に失敗しました: ${response.error.error}`);
        setFeaturedTracks([]);
      } else {
        setFeaturedTracks(response.data?.data || []);
      }
    } catch (err) {
      setError(`エラーが発生しました: ${err}`);
      setFeaturedTracks([]);
    } finally {
      setLoadingFeatured(false);
    }
  };

  // Fetch recent/trending tracks
  const fetchRecentTracks = async () => {
    try {
      setLoadingRecent(true);
      const response = await api.tracks.suggestions({ limit: 6 });
      if (response.error) {
        setRecentTracks([]);
      } else {
        const tracks = response.data?.data || [];
        // Take last 6 to get different tracks
        setRecentTracks(tracks.slice(-4));
      }
    } catch (err) {
      setRecentTracks([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchFeaturedTracks();
    // Delay second request to avoid rate limits
    const timer = setTimeout(fetchRecentTracks, 500);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFeaturedTracks(), fetchRecentTracks()]);
    setRefreshing(false);
  };

  const handlePlayToggle = (track: Track) => {
    if (audioState.isPlaying && audioState.currentTrack?.id === track.id) {
      audioActions.pause();
    } else {
      audioActions.play(track);
    }
  };

  const navigateToSwipe = () => {
    navigation.navigate('Swipe');
  };

  const navigateToLibrary = () => {
    navigation.navigate('Library');
  };

  if (loadingFeatured && loadingRecent && !refreshing) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>音楽を発見</Text>
          <Text style={styles.headerSubtitle}>
            新しいアーティストや楽曲を見つけて、あなたの音楽体験を広げましょう
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="アーティストや楽曲を検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Genre Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ジャンル</Text>
          <View style={styles.genreGrid}>
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={styles.genreButton}
                activeOpacity={0.7}
              >
                <Text style={styles.genreButtonText}>{genre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Music */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>おすすめの楽曲</Text>
          </View>
          {loadingFeatured ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>楽曲を読み込み中...</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.trackScrollView}
            >
              {featuredTracks.slice(0, 4).map((track) => (
                <View key={track.id} style={styles.trackCardContainer}>
                  <TrackCard
                    track={track}
                    onPlayToggle={() => handlePlayToggle(track)}
                    isPlaying={
                      audioState.isPlaying && audioState.currentTrack?.id === track.id
                    }
                    isLoading={audioState.isLoading}
                    style={styles.trackCard}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recent/Trending */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近人気の楽曲</Text>
          </View>
          {loadingRecent ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>楽曲を読み込み中...</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.trackScrollView}
            >
              {recentTracks.map((track) => (
                <View key={track.id} style={styles.trackCardContainer}>
                  <TrackCard
                    track={track}
                    onPlayToggle={() => handlePlayToggle(track)}
                    isPlaying={
                      audioState.isPlaying && audioState.currentTrack?.id === track.id
                    }
                    isLoading={audioState.isLoading}
                    style={styles.trackCard}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.actionCard}>
            <Text style={styles.actionCardTitle}>音楽ライブラリを始めよう</Text>
            <Text style={styles.actionCardDescription}>
              お気に入りの楽曲を保存して、プレイリストを作成しましょう
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={navigateToLibrary}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>ライブラリを見る</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={navigateToSwipe}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>楽曲スワイプを始める</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  genreButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  genreButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  trackScrollView: {
    paddingLeft: 20,
  },
  trackCardContainer: {
    marginRight: 16,
  },
  trackCard: {
    width: trackCardWidth,
  },
  actionCard: {
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  actionCardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
