import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useAuth} from '../contexts';
import {AuthStackParamList} from '../types';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {login, loading, error} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    const success = await login({email, password});
    if (!success && error) {
      Alert.alert('ログインエラー', error);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Otodoki2</Text>
          <Text style={styles.subtitle}>音楽を発見しよう</Text>

          <View style={styles.form}>
            <Text style={styles.label}>メールアドレス</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>パスワード</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="パスワードを入力"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'ログイン中...' : 'ログイン'}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>アカウントをお持ちでないですか？</Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>新規登録</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  registerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  registerLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});