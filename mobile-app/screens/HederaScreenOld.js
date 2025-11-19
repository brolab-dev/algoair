import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { API_URL } from './HomeScreen';

// Backend API URL (same server as air quality data)
const BACKEND_URL = API_URL.replace('/api/airquality', '');

const HederaScreen = () => {
  const [accountId, setAccountId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [topicId, setTopicId] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [currentData, setCurrentData] = useState(null);

  // Fetch current air quality data
  const fetchCurrentData = async () => {
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      
      if (json.temperature !== undefined) {
        setCurrentData(json);
      } else if (json.data) {
        setCurrentData(json.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchCurrentData();
    const interval = setInterval(fetchCurrentData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Create a new topic on Hedera testnet
  const createTopic = async () => {
    if (!accountId || !privateKey) {
      Alert.alert('Error', 'Please enter your Hedera Account ID and Private Key');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/hedera/create-topic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          privateKey,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTopicId(result.topicId);
        Alert.alert('Success', `Topic created! Topic ID: ${result.topicId}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to create topic');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      Alert.alert('Error', `Failed to create topic: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit air quality data to Hedera topic
  const submitDataToHedera = async () => {
    if (!accountId || !privateKey || !topicId) {
      Alert.alert('Error', 'Please enter Account ID, Private Key, and Topic ID');
      return;
    }

    if (!currentData) {
      Alert.alert('Error', 'No air quality data available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/hedera/submit-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          privateKey,
          topicId,
          data: currentData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLastSubmission({
          time: new Date().toLocaleString(),
          data: result.data,
        });
        Alert.alert('Success', 'Air quality data submitted to Hedera blockchain!');
      } else {
        Alert.alert('Error', result.error || 'Failed to submit data');
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      Alert.alert('Error', `Failed to submit data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>⛓️</Text>
            </View>
            <View>
              <Text style={styles.title}>Hedera Blockchain</Text>
              <Text style={styles.subtitle}>Consensus Service</Text>
            </View>
          </View>
        </View>

        {/* Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HEDERA TESTNET CONFIGURATION</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Account ID</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0.xxxxx"
              value={accountId}
              onChangeText={setAccountId}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Private Key</Text>
            <TextInput
              style={styles.input}
              placeholder="302e020100300506032b657004220420..."
              value={privateKey}
              onChangeText={setPrivateKey}
              autoCapitalize="none"
              secureTextEntry
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Topic ID (optional - create new if empty)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0.xxxxx"
              value={topicId}
              onChangeText={setTopicId}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Current Data Preview */}
        {currentData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CURRENT AIR QUALITY DATA</Text>
            <View style={styles.card}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Temperature:</Text>
                <Text style={styles.dataValue}>{currentData.temperature?.toFixed(1)}°C</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Humidity:</Text>
                <Text style={styles.dataValue}>{currentData.humidity?.toFixed(1)}%</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>PM2.5:</Text>
                <Text style={styles.dataValue}>{currentData.pm25} µg/m³</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>PM10:</Text>
                <Text style={styles.dataValue}>{currentData.pm10} µg/m³</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>AQI:</Text>
                <Text style={styles.dataValue}>{currentData.aqi}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Status:</Text>
                <Text style={styles.dataValue}>{currentData.status}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={createTopic}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>➕</Text>
                <Text style={styles.buttonText}>Create New Topic</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={submitDataToHedera}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>🚀</Text>
                <Text style={styles.buttonText}>Submit Data to Hedera</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Last Submission */}
        {lastSubmission && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LAST SUBMISSION</Text>
            <View style={styles.card}>
              <Text style={styles.successText}>✅ Data submitted successfully!</Text>
              <Text style={styles.timestampText}>Time: {lastSubmission.time}</Text>
              <Text style={styles.infoText}>
                Your air quality data has been permanently recorded on the Hedera blockchain testnet.
              </Text>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT HEDERA CONSENSUS SERVICE</Text>
          <View style={styles.card}>
            <Text style={styles.infoText}>
              The Hedera Consensus Service (HCS) provides a decentralized, verifiable log of messages.
              {'\n\n'}
              Your air quality data is submitted to a topic on the Hedera testnet, creating an immutable
              record that can be verified by anyone.
              {'\n\n'}
              To get started, you need a Hedera testnet account. Visit portal.hedera.com to create one.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: '#6366F1',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  successText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});

export default HederaScreen;
