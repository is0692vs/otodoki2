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

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const {register, loading, error} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上である必要があります');
      return;
    }

    const success = await register({
      email,
      password,
      display_name: displayName || undefined,
    });
    
    if (!success && error) {
      Alert.alert('登録エラー', error);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>新規登録</Text>
          <Text style={styles.subtitle}>Otodoki2にようこそ</Text>

          <View style={styles.form}>
            <Text style={styles.label}>表示名（任意）</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="表示名を入力"
              placeholderTextColor="#9CA3AF"
            />

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
              placeholder="パスワードを入力（6文字以上）"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <Text style={styles.label}>パスワード確認</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="パスワードを再入力"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '登録中...' : 'アカウント作成'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>既にアカウントをお持ちですか？</Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>ログイン</Text>
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  loginText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  loginLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});