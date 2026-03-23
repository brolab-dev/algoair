import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Platform,
  Modal, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, shadow, shadowLight } from '../theme';

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000/api/airquality'
  : 'http://192.168.1.128:3000/api/airquality';
const BACKEND_URL = API_URL.replace('/api/airquality', '');

const ProfileScreen = ({ onLogout }) => {
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
  const [successModal, setSuccessModal] = useState(null);
  const [claimSuccessData, setClaimSuccessData] = useState(null);

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
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setUserInfo(data.user);
          setSubmissionCount(data.user.submissionCount || 0);
        } else {
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
      if (data.success) setSharedTopicInfo(data);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchCurrentData = async () => {
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      setCurrentData(json.temperature !== undefined ? json : json.data);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchSubmissionHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/user/submissions?limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setSubmissionCount(data.totalCount);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchTokenBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/rewards/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setAirTokenBalance(data.balance);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchUnclaimedSubmissions = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/rewards/unclaimed`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setUnclaimedSubmissions(data.unclaimed);
    } catch (error) { console.error('Error:', error); }
  };

  const getLocation = () => {
    const locations = [
      { name: 'Hoan Kiem Lake, Hanoi', latitude: 21.0285, longitude: 105.8542 },
      { name: 'West Lake, Hanoi', latitude: 21.0461, longitude: 105.8197 },
      { name: 'Ben Thanh Market, HCMC', latitude: 10.7725, longitude: 106.6980 },
      { name: 'Notre Dame Cathedral, HCMC', latitude: 10.7797, longitude: 106.6994 },
    ];
    setLocation(locations[Math.floor(Math.random() * locations.length)]);
    setIsLocationLoading(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => onLogout && onLogout() },
    ]);
  };

  const handleClaimAllRewards = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/rewards/claim-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        const count = unclaimedSubmissions.length;
        const msgMatch = (result.message || '').match(/(\d+)\s*AIR/i);
        const amount = msgMatch ? parseInt(msgMatch[1], 10) : count * 10;
        setClaimSuccessData({ amount, count });
        fetchTokenBalance();
        fetchUnclaimedSubmissions();
      } else {
        Alert.alert('Error', result.error || 'Failed to claim rewards');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to claim: ${error.message}`);
    } finally { setLoading(false); }
  };

  const submitDataToHedera = async () => {
    if (!currentData) { Alert.alert('Error', 'No air quality data available'); return; }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/hedera/submit-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          data: { ...currentData, latitude: location?.latitude, longitude: location?.longitude },
        }),
      });
      const result = await response.json();
      if (result.success) {
        setLastSubmission({ timestamp: result.timestamp, topicId: result.topicId, hashscanUrl: result.hashscanUrl });
        fetchSubmissionHistory();
        fetchUnclaimedSubmissions();
        setSuccessModal({
          topicId: result.topicId,
          hashscanUrl: result.hashscanUrl,
          timestamp: result.timestamp,
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to submit');
      }
    } catch (error) {
      Alert.alert('Error', `Failed: ${error.message}`);
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Account Card */}
        <View style={styles.card}>
          {userInfo ? (
            <>
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(userInfo.email || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.avatarInfo}>
                  <Text style={styles.email}>{userInfo.email}</Text>
                  <Text style={styles.walletId}>{userInfo.hederaAccountId}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{submissionCount}</Text>
                  <Text style={styles.statLabel}>Submissions</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.accent }]}>
                    {airTokenBalance.toFixed(1)}
                  </Text>
                  <Text style={styles.statLabel}>AIR Tokens</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingSmall}>Loading account...</Text>
            </View>
          )}
        </View>

        {/* Claim Rewards */}
        {unclaimedSubmissions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Unclaimed Rewards</Text>
            <Text style={styles.cardDesc}>
              You have {unclaimedSubmissions.length} rewards to claim
            </Text>
            <TouchableOpacity
              style={styles.claimButton}
              onPress={handleClaimAllRewards}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.claimButtonText}>
                Claim All ({unclaimedSubmissions.length * 10} AIR)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Topic Info */}
        {sharedTopicInfo && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Shared Topic</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Topic ID</Text>
              <Text style={styles.infoValue}>{sharedTopicInfo.topicId}</Text>
            </View>
            <Text style={styles.infoNote}>All users submit to this shared topic</Text>
          </View>
        )}

        {/* Current Data */}
        {currentData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Reading</Text>
            <View style={styles.dataGrid}>
              <DataPill label="Temp" value={`${currentData.temperature}°C`} />
              <DataPill label="Humidity" value={`${currentData.humidity}%`} />
              <DataPill label="PM2.5" value={`${currentData.pm25}`} />
              <DataPill label="AQI" value={`${currentData.aqi}`} />
            </View>
            {location && (
              <Text style={styles.locationText}>{location.name}</Text>
            )}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (loading || isLocationLoading) && styles.submitDisabled]}
          onPress={submitDataToHedera}
          disabled={loading || isLocationLoading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Submit to Blockchain</Text>
          )}
        </TouchableOpacity>

        {/* Last Submission */}
        {lastSubmission && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Last Submission</Text>
            <Text style={styles.cardDesc}>
              {new Date(lastSubmission.timestamp).toLocaleString()}
            </Text>
            <Text style={styles.infoNote}>Topic: {lastSubmission.topicId}</Text>
          </View>
        )}

        {/* How It Works */}
        <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: colors.blue }]}>
          <Text style={[styles.cardTitle, { color: colors.blue }]}>How It Works</Text>
          <Text style={styles.howText}>
            1. Your Hedera wallet is auto-generated{'\n'}
            2. Tap "Submit to Blockchain"{'\n'}
            3. Data is recorded on Hedera{'\n'}
            4. Earn AIR tokens as rewards
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Claim Success Modal */}
      <Modal
        visible={!!claimSuccessData}
        transparent
        animationType="fade"
        onRequestClose={() => setClaimSuccessData(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.claimModalCard}>
            {/* Header */}
            <View style={styles.claimModalHeader}>
              <View style={styles.claimCheckOuter}>
                <View style={styles.claimCheckCircle}>
                  <Ionicons name="checkmark-sharp" size={34} color="#fff" />
                </View>
              </View>
              <Text style={styles.claimModalTitle}>Claimed!</Text>
            </View>

            {/* Body */}
            <View style={styles.claimModalBody}>
              {/* Amount */}
              <View style={styles.claimAmountWrap}>
                <Text style={styles.claimAmountPlus}>+</Text>
                <Text style={styles.claimAmountNum}>{claimSuccessData?.amount || 0}</Text>
                <View style={styles.claimAmountBadge}>
                  <Text style={styles.claimAmountBadgeText}>AIR</Text>
                </View>
              </View>
              <Text style={styles.claimAmountSub}>
                from {claimSuccessData?.count || 0} data submission{(claimSuccessData?.count || 0) !== 1 ? 's' : ''}
              </Text>

              {/* Divider */}
              <View style={styles.claimDivider} />

              {/* Status rows */}
              <View style={styles.claimStatusRow}>
                <View style={styles.claimStatusDot} />
                <Text style={styles.claimStatusText}>Verified on Hedera</Text>
                <Ionicons name="checkmark" size={16} color={colors.accent} />
              </View>
              <View style={styles.claimStatusRow}>
                <View style={styles.claimStatusDot} />
                <Text style={styles.claimStatusText}>Tokens sent to wallet</Text>
                <Ionicons name="checkmark" size={16} color={colors.accent} />
              </View>
              <View style={styles.claimStatusRow}>
                <View style={[styles.claimStatusDot, { backgroundColor: '#FFB74D' }]} />
                <Text style={styles.claimStatusText}>Balance updated</Text>
                <Ionicons name="checkmark" size={16} color={colors.accent} />
              </View>

              {/* Thank you */}
              <View style={styles.claimThankYou}>
                <Text style={styles.claimThankYouIcon}>🌱</Text>
                <Text style={styles.claimThankYouText}>
                  Thanks for contributing clean air data!
                </Text>
              </View>

              {/* Button */}
              <TouchableOpacity
                style={styles.claimDoneBtn}
                onPress={() => setClaimSuccessData(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.claimDoneBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={!!successModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="checkmark-circle" size={56} color={colors.accent} />
            </View>
            <Text style={styles.modalTitle}>Submitted Successfully</Text>
            <Text style={styles.modalDesc}>
              Your air quality data has been recorded on the Hedera blockchain.
            </Text>

            <View style={styles.modalInfoBox}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Topic</Text>
                <Text style={styles.modalInfoValue}>{successModal?.topicId}</Text>
              </View>
              <View style={[styles.modalInfoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.modalInfoLabel}>Time</Text>
                <Text style={styles.modalInfoValue}>
                  {successModal?.timestamp ? new Date(successModal.timestamp).toLocaleTimeString() : 'Just now'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                if (successModal?.hashscanUrl) Linking.openURL(successModal.hashscanUrl);
                setSuccessModal(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="open-outline" size={18} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.modalPrimaryText}>View on HashScan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => setSuccessModal(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSecondaryText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DataPill = ({ label, value }) => (
  <View style={styles.dataPill}>
    <Text style={styles.dataPillLabel}>{label}</Text>
    <Text style={styles.dataPillValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  logoutBtn: {
    backgroundColor: '#EF444422',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: { fontSize: 13, fontWeight: '600', color: colors.danger },

  // Account
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    ...shadowLight,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.white },
  avatarInfo: { flex: 1 },
  email: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  walletId: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statNumber: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  loadingWrap: { alignItems: 'center', paddingVertical: 20 },
  loadingSmall: { fontSize: 13, color: colors.textMuted, marginTop: 8 },

  // Cards
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  cardDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 14, color: colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.blue },
  infoNote: { fontSize: 12, color: colors.textMuted, marginTop: 8, fontStyle: 'italic' },

  // Claim
  claimButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },

  // Data
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dataPill: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  dataPillLabel: { fontSize: 10, color: colors.textMuted, marginBottom: 2 },
  dataPillValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  locationText: { fontSize: 12, color: colors.textMuted },

  // Submit
  submitButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    ...shadowLight,
  },
  submitDisabled: { backgroundColor: colors.border },
  submitText: { color: colors.white, fontSize: 17, fontWeight: '700' },

  // How
  howText: { fontSize: 14, color: colors.textSecondary, lineHeight: 24 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    ...shadow,
  },
  modalIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInfoBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalInfoLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  modalInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  modalSecondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Claim Success Modal
  claimModalCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow,
  },
  claimModalHeader: {
    backgroundColor: '#1B5E20',
    paddingTop: 30,
    paddingBottom: 24,
    alignItems: 'center',
  },
  claimCheckOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  claimCheckCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  claimModalBody: {
    padding: 24,
    alignItems: 'center',
  },
  claimAmountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  claimAmountPlus: {
    fontSize: 26,
    fontWeight: '300',
    color: '#2E7D32',
    marginRight: 2,
  },
  claimAmountNum: {
    fontSize: 46,
    fontWeight: '900',
    color: '#1B5E20',
    letterSpacing: -1,
  },
  claimAmountBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  claimAmountBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 1,
  },
  claimAmountSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
  },
  claimDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  claimStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  claimStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: 12,
  },
  claimStatusText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  claimThankYou: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  claimThankYouIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  claimThankYouText: {
    fontSize: 13,
    color: '#795548',
    flex: 1,
    fontWeight: '500',
  },
  claimDoneBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    ...shadow,
  },
  claimDoneBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;
