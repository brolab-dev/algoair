import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './HomeScreen';

const BACKEND_URL = API_URL.replace('/api/airquality', '');

const HederaScreen = ({ onLogout }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [sharedTopicInfo, setSharedTopicInfo] = useState(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [airTokenBalance, setAirTokenBalance] = useState(0);
  const [unclaimedSubmissions, setUnclaimedSubmissions] = useState([]);
  const [location, setLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [claimSuccessVisible, setClaimSuccessVisible] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [confettiAnim] = useState(new Animated.Value(0));

  // Load user info on mount
  useEffect(() => {
    loadUserInfo();
    fetchSharedTopicInfo();
    fetchCurrentData();
    fetchSubmissionHistory();
    fetchTokenBalance();
    fetchUnclaimedSubmissions();
    getLocation();
    const interval = setInterval(fetchCurrentData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUserInfo = async () => {
    try {
      const email = await AsyncStorage.getItem('user_email');
      const hederaAccountId = await AsyncStorage.getItem('hedera_account_id');
      const token = await AsyncStorage.getItem('auth_token');

      if (email && token) {
        // Fetch full user info from backend
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setUserInfo(data.user);
          setSubmissionCount(data.user.submissionCount || 0);
        } else {
          // Fallback to local storage
          setUserInfo({ email, hederaAccountId });
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const fetchSharedTopicInfo = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/hedera/shared-topic`);
      const data = await response.json();
      if (data.success) {
        setSharedTopicInfo(data);
      }
    } catch (error) {
      console.error('Error fetching topic info:', error);
    }
  };

  const fetchCurrentData = async () => {
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      setCurrentData(json.temperature !== undefined ? json : json.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchSubmissionHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/user/submissions?limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSubmissionCount(data.totalCount);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchTokenBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/rewards/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAirTokenBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };

  const fetchUnclaimedSubmissions = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/rewards/unclaimed`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUnclaimedSubmissions(data.unclaimed);
      }
    } catch (error) {
      console.error('Error fetching unclaimed submissions:', error);
    }
  };

  const getLocation = () => {
    const locations = [
      { name: 'Hoan Kiem Lake, Hanoi', latitude: 21.0285, longitude: 105.8542 },
      { name: 'West Lake, Hanoi', latitude: 21.0461, longitude: 105.8197 },
      { name: 'Ben Thanh Market, HCMC', latitude: 10.7725, longitude: 106.6980 },
      { name: 'Notre Dame Cathedral, HCMC', latitude: 10.7797, longitude: 106.6994 },
    ];

    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    setLocation(randomLocation);
    setIsLocationLoading(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  const handleClaimAllRewards = async () => {
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('auth_token');

      const response = await fetch(`${BACKEND_URL}/api/rewards/claim-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        // Capture values before refreshing
        const claimedCount = unclaimedSubmissions.length;
        const claimedAmount = claimedCount * 10;
        // Parse amount from server message if available (e.g. "Successfully claimed 10 AIR tokens")
        const msgMatch = (result.message || '').match(/(\d+)\s*AIR/i);
        const finalAmount = msgMatch ? parseInt(msgMatch[1], 10) : claimedAmount;

        setClaimResult({
          message: result.message || 'Rewards claimed successfully!',
          amount: finalAmount,
          count: claimedCount,
        });

        // Animate modal in
        scaleAnim.setValue(0);
        confettiAnim.setValue(0);
        setClaimSuccessVisible(true);

        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();

        // Refresh data after showing modal
        fetchTokenBalance();
        fetchUnclaimedSubmissions();
      } else {
        Alert.alert('Error', result.error || 'Failed to claim rewards');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to claim: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitDataToHedera = async () => {
    if (!currentData) {
      Alert.alert('Error', 'No air quality data available');
      return;
    }

    setLoading(true);

    try {
      // Get auth token
      const token = await AsyncStorage.getItem('auth_token');

      const response = await fetch(`${BACKEND_URL}/api/hedera/submit-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            ...currentData,
            latitude: location?.latitude,
            longitude: location?.longitude,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLastSubmission({
          timestamp: result.timestamp,
          topicId: result.topicId,
          hashscanUrl: result.hashscanUrl,
        });

        // Refresh submission count and unclaimed rewards
        fetchSubmissionHistory();
        fetchUnclaimedSubmissions();

        Alert.alert(
          'Success! 🎉',
          `Data submitted to Hedera blockchain!\n\nTopic: ${result.topicId}\n\nView on HashScan?`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'View',
              onPress: () => {
                // Could open browser here
                Alert.alert('HashScan URL', result.hashscanUrl);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit data');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to submit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⛓️ Hedera Blockchain</Text>
          <Text style={styles.subtitle}>
            Submit air quality data to the blockchain
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>� Account Info</Text>
          {userInfo ? (
            <View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Email</Text>
                <Text style={styles.walletValue}>{userInfo.email}</Text>
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Hedera Wallet</Text>
                <Text style={styles.walletValue}>{userInfo.hederaAccountId}</Text>
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Submissions</Text>
                <Text style={styles.walletValue}>{submissionCount} 📊</Text>
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>AIR Token Balance</Text>
                <Text style={styles.walletValue}>{airTokenBalance.toFixed(2)} AIR</Text>
              </View>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>🚪 Logout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <ActivityIndicator color="#4CAF50" />
              <Text style={styles.loadingText}>Loading account info...</Text>
            </View>
          )}
        </View>

        {/* Claim Rewards */}
        {unclaimedSubmissions.length > 0 && (
          <View style={styles.claimCard}>
            <View style={styles.claimCardGlow} />
            <Text style={styles.claimCardTitle}>🎁 Claim Your AIR Tokens</Text>
            <View style={styles.claimAllContainer}>
              <View style={styles.claimBadge}>
                <Text style={styles.claimBadgeNumber}>{unclaimedSubmissions.length}</Text>
                <Text style={styles.claimBadgeLabel}>
                  reward{unclaimedSubmissions.length !== 1 ? 's' : ''} available
                </Text>
              </View>
              <View style={styles.claimAmountRow}>
                <Text style={styles.claimAmountLabel}>Total to claim</Text>
                <Text style={styles.claimAmountValue}>{unclaimedSubmissions.length * 10} AIR</Text>
              </View>
              <TouchableOpacity
                style={[styles.claimAllButton, loading && styles.claimAllButtonDisabled]}
                onPress={handleClaimAllRewards}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.claimButtonInner}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.claimAllButtonText}>Claiming...</Text>
                  </View>
                ) : (
                  <View style={styles.claimButtonInner}>
                    <Text style={styles.claimButtonIcon}>💎</Text>
                    <Text style={styles.claimAllButtonText}>
                      Claim All Rewards
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Shared Topic Info */}
        {sharedTopicInfo && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Shared Topic</Text>
            <View style={styles.topicInfo}>
              <Text style={styles.topicLabel}>Topic ID</Text>
              <Text style={styles.topicValue}>{sharedTopicInfo.topicId}</Text>
            </View>
            <Text style={styles.topicDescription}>
              All users submit to this shared topic
            </Text>
          </View>
        )}

        {/* Current Data Preview */}
        {currentData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Current Data</Text>
            <View style={styles.dataGrid}>
              <DataItem label="Temp" value={`${currentData.temperature}°C`} />
              <DataItem label="Humidity" value={`${currentData.humidity}%`} />
              <DataItem label="PM2.5" value={`${currentData.pm25} µg/m³`} />
              <DataItem label="AQI" value={currentData.aqi} />
              {location && (
                <DataItem
                  label="Location"
                  value={`${location.name}`}
                />
              )}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || isLocationLoading) && styles.submitButtonDisabled,
          ]}
          onPress={submitDataToHedera}
          disabled={loading || isLocationLoading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : isLocationLoading ? (
            <Text style={styles.submitButtonText}>Getting Location...</Text>
          ) : (
            <Text style={styles.submitButtonText}>
              🚀 Submit to Blockchain
            </Text>
          )}
        </TouchableOpacity>

        {/* Last Submission */}
        {lastSubmission && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✅ Last Submission</Text>
            <Text style={styles.submissionText}>
              Submitted at: {new Date(lastSubmission.timestamp).toLocaleString()}
            </Text>
            <Text style={styles.submissionText}>
              Topic: {lastSubmission.topicId}
            </Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ How It Works</Text>
          <Text style={styles.infoText}>
            1. Your Hedera wallet is auto-generated{'\n'}
            2. Tap "Submit to Blockchain"{'\n'}
            3. Data is recorded on Hedera{'\n'}
            4. View on HashScan explorer
          </Text>
        </View>
      </ScrollView>

      {/* Claim Success Modal */}
      <Modal
        visible={claimSuccessVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClaimSuccessVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.successModal,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            {/* Gradient-like header background */}
            <View style={styles.successHeader}>
              <View style={styles.successHeaderInner}>
                {/* Floating particles */}
                <Animated.View style={[styles.particle, styles.particle1, { opacity: confettiAnim }]} />
                <Animated.View style={[styles.particle, styles.particle2, { opacity: confettiAnim }]} />
                <Animated.View style={[styles.particle, styles.particle3, { opacity: confettiAnim }]} />
                <Animated.View style={[styles.particle, styles.particle4, { opacity: confettiAnim }]} />
                <Animated.View style={[styles.particle, styles.particle5, { opacity: confettiAnim }]} />
                <Animated.View style={[styles.particle, styles.particle6, { opacity: confettiAnim }]} />
                <Animated.View style={[styles.particle, styles.particle7, { opacity: confettiAnim }]} />
                <Animated.View style={[styles.particle, styles.particle8, { opacity: confettiAnim }]} />

                {/* Checkmark circle */}
                <Animated.View style={[
                  styles.checkCircleOuter,
                  { transform: [{ scale: confettiAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.15, 1],
                  }) }] },
                ]}>
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                </Animated.View>

                <Text style={styles.successHeaderTitle}>Successfully Claimed!</Text>
              </View>
            </View>

            {/* Amount section */}
            <View style={styles.successBody}>
              <View style={styles.amountContainer}>
                <Text style={styles.amountPrefix}>+</Text>
                <Text style={styles.amountNumber}>{claimResult?.amount || 0}</Text>
                <View style={styles.amountTokenBadge}>
                  <Text style={styles.amountTokenText}>AIR</Text>
                </View>
              </View>
              <Text style={styles.amountSubtext}>
                from {claimResult?.count || 0} data submission{(claimResult?.count || 0) !== 1 ? 's' : ''}
              </Text>

              {/* Divider */}
              <View style={styles.successDivider} />

              {/* Status rows */}
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Verified on Hedera blockchain</Text>
                <Text style={styles.statusCheck}>✓</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Tokens sent to your wallet</Text>
                <Text style={styles.statusCheck}>✓</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: '#FFB74D' }]} />
                <Text style={styles.statusText}>Balance updated</Text>
                <Text style={styles.statusCheck}>✓</Text>
              </View>

              {/* Thank you note */}
              <View style={styles.thankYouBox}>
                <Text style={styles.thankYouEmoji}>🌱</Text>
                <Text style={styles.thankYouText}>
                  Thanks for contributing clean air data!
                </Text>
              </View>

              {/* Close button */}
              <TouchableOpacity
                style={styles.successCloseButton}
                onPress={() => setClaimSuccessVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.successCloseButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const DataItem = ({ label, value }) => (
  <View style={styles.dataItem}>
    <Text style={styles.dataLabel}>{label}</Text>
    <Text style={styles.dataValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2d6a4f',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  walletInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  walletLabel: {
    fontSize: 14,
    color: '#666',
  },
  walletValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  notConnectedText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
  logoutButton: {
    backgroundColor: '#ff9800',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  claimCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  claimCardGlow: {
    height: 4,
    backgroundColor: '#4CAF50',
  },
  claimCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  claimAllContainer: {
    alignItems: 'center',
    padding: 20,
  },
  claimBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  claimBadgeNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2E7D32',
    marginRight: 8,
  },
  claimBadgeLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  claimAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
    marginBottom: 16,
  },
  claimAmountLabel: {
    fontSize: 14,
    color: '#888',
  },
  claimAmountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
  },
  claimAllButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  claimAllButtonDisabled: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0.1,
  },
  claimButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  claimAllButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  topicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  topicLabel: {
    fontSize: 14,
    color: '#666',
  },
  topicValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  topicDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dataItem: {
    width: '50%',
    paddingVertical: 8,
  },
  dataLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submissionText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    width: '100%',
    maxWidth: 350,
    overflow: 'hidden',
  },
  successHeader: {
    backgroundColor: '#1B5E20',
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    overflow: 'hidden',
  },
  successHeaderInner: {
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    borderRadius: 6,
  },
  particle1: { width: 10, height: 10, backgroundColor: '#FFD700', top: 8, left: 30 },
  particle2: { width: 7, height: 7, backgroundColor: '#81C784', top: 20, right: 40 },
  particle3: { width: 8, height: 8, backgroundColor: '#FFF176', bottom: 15, left: 50 },
  particle4: { width: 6, height: 6, backgroundColor: '#A5D6A7', top: 35, left: 15 },
  particle5: { width: 9, height: 9, backgroundColor: '#FFB74D', bottom: 10, right: 25 },
  particle6: { width: 5, height: 5, backgroundColor: '#E0E0E0', top: 12, right: 60 },
  particle7: { width: 8, height: 8, backgroundColor: '#80CBC4', bottom: 30, right: 55 },
  particle8: { width: 6, height: 6, backgroundColor: '#FFCC80', top: 5, left: 70 },
  checkCircleOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2E7D32',
  },
  successHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  successBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  amountPrefix: {
    fontSize: 28,
    fontWeight: '300',
    color: '#2E7D32',
    marginRight: 2,
  },
  amountNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1B5E20',
    letterSpacing: -1,
  },
  amountTokenBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  amountTokenText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 1,
  },
  amountSubtext: {
    fontSize: 13,
    color: '#999',
    marginBottom: 20,
  },
  successDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E8F5E9',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
  },
  statusCheck: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  thankYouBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  thankYouEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  thankYouText: {
    fontSize: 13,
    color: '#795548',
    flex: 1,
    fontWeight: '500',
  },
  successCloseButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default HederaScreen;

