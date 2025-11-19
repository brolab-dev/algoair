import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WalletConnectScreen = ({ visible, onConnect, onSkip }) => {
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  const validateAccountId = (id) => {
    // Hedera account ID format: 0.0.xxxxx
    const regex = /^0\.0\.\d+$/;
    return regex.test(id.trim());
  };

  const handleConnect = async () => {
    if (!accountId.trim()) {
      Alert.alert('Error', 'Please enter your Hedera Account ID');
      return;
    }

    if (!validateAccountId(accountId)) {
      Alert.alert(
        'Invalid Format',
        'Account ID must be in format: 0.0.xxxxx\nExample: 0.0.12345'
      );
      return;
    }

    setLoading(true);

    try {
      // Save wallet info to AsyncStorage
      const walletInfo = {
        accountId: accountId.trim(),
        accountName: accountName.trim() || 'My Wallet',
        connectedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('hedera_wallet', JSON.stringify(walletInfo));

      Alert.alert(
        'Success! 🎉',
        `Wallet connected!\nAccount: ${accountId.trim()}`,
        [
          {
            text: 'OK',
            onPress: () => {
              onConnect(walletInfo);
              setAccountId('');
              setAccountName('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save wallet info: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Wallet Connection?',
      'You can still use the app, but your submissions will be anonymous.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            onSkip();
            setAccountId('');
            setAccountName('');
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>🔗 Connect Your Wallet</Text>
            <Text style={styles.subtitle}>
              Connect your Hedera wallet to identify your air quality submissions
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ Why Connect?</Text>
              <Text style={styles.infoText}>
                • Identify your submissions on the blockchain{'\n'}
                • Track your contribution history{'\n'}
                • Optional - you can skip and use anonymously
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Hedera Account ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0.12345"
                value={accountId}
                onChangeText={setAccountId}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numeric"
              />
              <Text style={styles.hint}>
                Format: 0.0.xxxxx (e.g., 0.0.12345)
              </Text>

              <Text style={styles.label}>Wallet Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="My Wallet"
                value={accountName}
                onChangeText={setAccountName}
                autoCapitalize="words"
              />
              <Text style={styles.hint}>
                Give your wallet a friendly name
              </Text>
            </View>

            <View style={styles.helpBox}>
              <Text style={styles.helpTitle}>📱 Don't have a wallet?</Text>
              <Text style={styles.helpText}>
                Get a free Hedera testnet account at:{'\n'}
                <Text style={styles.link}>portal.hedera.com</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleConnect}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Connecting...' : '🔗 Connect Wallet'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSkip}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Skip for Now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d6a4f',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d6a4f',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  helpBox: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e65100',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  link: {
    color: '#2196F3',
    fontWeight: '600',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WalletConnectScreen;

