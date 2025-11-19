import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
        Alert.alert('Success!', result.message || 'Rewards claimed successfully!');
        // Refresh data
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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>[object Object]Claim Your AIR Tokens</Text>
            <View style={styles.claimAllContainer}>
              <Text style={styles.claimAllText}>
                You have {unclaimedSubmissions.length} rewards to claim!
              </Text>
              <TouchableOpacity
                style={styles.claimAllButton}
                onPress={handleClaimAllRewards}
                disabled={loading}
              >
                <Text style={styles.claimAllButtonText}>
                  Claim All ({unclaimedSubmissions.length * 10} AIR)
                </Text>
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
  claimAllContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  claimAllText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  claimAllButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  claimAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
});

export default HederaScreen;

