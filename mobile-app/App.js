import React, { Suspense, lazy, useState, useEffect } from 'react';
import { StatusBar, Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from './screens/AuthScreen';

// Dynamic imports - only load the navigation needed for the current platform
// This prevents webpack from bundling React Navigation for web builds
const WebNavigation = lazy(() => import('./navigation/WebNavigation'));
const MobileNavigation = lazy(() => import('./navigation/MobileNavigation'));

// Loading component while navigation loads
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#4CAF50" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_email');
    await AsyncStorage.removeItem('hedera_account_id');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </>
    );
  }

  // Detect platform and load appropriate navigation
  const Navigation = Platform.OS === 'web' ? WebNavigation : MobileNavigation;

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Suspense fallback={<LoadingScreen />}>
        <Navigation onLogout={handleLogout} />
      </Suspense>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default App;
