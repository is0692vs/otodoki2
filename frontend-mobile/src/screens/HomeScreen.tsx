import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {api} from '../services';
import {useAuth} from '../contexts';
import {MainTabParamList, Track} from '../types';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {user, logout} = useAuth();
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedTracks = async () => {
      try {
        setLoading(true);
        const response = await api.tracks.suggestions({limit: 6});
        if (response.error) {
          setError(`楽曲の取得に失敗しました: ${response.error.error}`);
        } else {
          setFeaturedTracks(response.data?.data || []);
        }
      } catch (err) {
        setError(`エラーが発生しました: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedTracks();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const navigateToSwipe = () => {
    navigation.navigate('Swipe');
  };

  const navigateToLibrary = () => {
    navigation.navigate('Library');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            おかえりなさい{user?.display_name && `、${user.display_name}`}さん！
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>音楽を発見</Text>
          <Text style={styles.sectionDescription}>
            新しいアーティストや楽曲を見つけて、あなたの音楽体験を広げましょう
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToSwipe}>
            <Text style={styles.primaryButtonText}>楽曲スワイプを始める</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={navigateToLibrary}>
            <Text style={styles.secondaryButtonText}>ライブラリを見る</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>おすすめの楽曲</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#3B82F6" />
              <Text style={styles.loadingText}>楽曲を読み込み中...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.trackGrid}>
              {featuredTracks.slice(0, 4).map((track, index) => (
                <View key={`${track.id}-${index}`} style={styles.trackCard}>
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
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>音楽ライブラリを始めよう</Text>
          <Text style={styles.sectionDescription}>
            お気に入りの楽曲を保存して、自分だけのコレクションを作成しましょう
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 6,
  },
  logoutText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#4B5563',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  trackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  trackCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackArtist: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 2,
  },
  trackAlbum: {
    color: '#6B7280',
    fontSize: 11,
  },
});