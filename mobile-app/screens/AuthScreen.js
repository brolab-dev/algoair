import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, shadow, shadowLight } from '../theme';

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000/api/airquality'
  : 'http://192.168.1.128:3000/api/airquality';
const BACKEND_URL = API_URL.replace('/api/airquality', '');

const AuthScreen = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Error', 'Please enter email and password'); return; }
    if (!validateEmail(email)) { Alert.alert('Error', 'Please enter a valid email'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (data.success) {
        await AsyncStorage.setItem('auth_token', data.token);
        await AsyncStorage.setItem('user_email', data.user.email);
        await AsyncStorage.setItem('hedera_account_id', data.user.hederaAccountId || '');
        Alert.alert(
          'Success',
          isLogin
            ? `Welcome back, ${data.user.email}!`
            : `Account created!\nHedera wallet: ${data.user.hederaAccountId}`,
          [{ text: 'OK', onPress: () => { onAuthSuccess(data); setEmail(''); setPassword(''); } }]
        );
      } else {
        Alert.alert('Error', data.error || 'Authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isLogin ? 'login' : 'register'}: ${error.message}`);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>A</Text>
          </View>
          <Text style={styles.title}>Air Quality</Text>
          <Text style={styles.subtitle}>Track air quality on the blockchain</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>{isLogin ? 'Welcome back' : 'Create account'}</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {!isLogin && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>A Hedera wallet will be created for you automatically</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)} disabled={loading}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchHighlight}>{isLogin ? 'Sign up' : 'Sign in'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <Feature icon="S" color={colors.accent} text="Secure authentication" />
          <Feature icon="W" color={colors.blue} text="Auto-generated Hedera wallet" />
          <Feature icon="D" color={colors.warning} text="Track air quality data" />
          <Feature icon="B" color={colors.veryUnhealthy} text="Submit to blockchain" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const Feature = ({ icon, color, text }) => (
  <View style={styles.featureItem}>
    <View style={[styles.featureIcon, { backgroundColor: color + '22' }]}>
      <Text style={[styles.featureIconText, { color }]}>{icon}</Text>
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },

  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoBadge: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    ...shadow,
  },
  logoLetter: { fontSize: 28, fontWeight: '800', color: colors.white },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textMuted },

  form: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    ...shadowLight,
  },
  formTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  infoBox: {
    backgroundColor: colors.accentLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { fontSize: 13, color: colors.accent, textAlign: 'center' },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: colors.border },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  switchButton: { marginTop: 16, alignItems: 'center' },
  switchText: { color: colors.textMuted, fontSize: 14 },
  switchHighlight: { color: colors.accent, fontWeight: '600' },

  features: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    ...shadowLight,
  },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  featureIcon: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  featureIconText: { fontSize: 14, fontWeight: '800' },
  featureText: { fontSize: 14, color: colors.textSecondary },
});

export default AuthScreen;
