import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, RefreshControl,
  TouchableOpacity, Linking, ActivityIndicator,
} from 'react-native';
import { colors, getAqiColor, getAqiLabel, shadowLight } from '../theme';

const TOPIC_ID = '0.0.8218381';
const MIRROR_NODE_URL = `https://testnet.mirrornode.hedera.com/api/v1/topics/${TOPIC_ID}/messages`;

const getValue = (s, key) => {
  if (!s) return '--';
  if (s[key] != null) return s[key];
  if (s.data && s.data[key] != null) return s.data[key];
  return '--';
};

const formatTimestamp = (ts) => {
  if (typeof ts === 'string') {
    const [sec] = ts.split('.');
    const ms = parseInt(sec, 10) * 1000;
    if (!Number.isNaN(ms)) return new Date(ms).toLocaleString();
  }
  return '--';
};

const extractLocation = (s) => {
  if (s?.latitude != null && s?.longitude != null) {
    return `${Number(s.latitude).toFixed(4)}, ${Number(s.longitude).toFixed(4)}`;
  }
  const loc = s?.location;
  if (!loc) return 'N/A';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    const lat = loc.lat ?? loc.latitude;
    const lng = loc.lng ?? loc.longitude;
    if (lat != null && lng != null) return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
  }
  return 'N/A';
};

const RecentSubmissionsScreen = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${MIRROR_NODE_URL}?order=desc&limit=100`);
      const data = await response.json();
      const messages = data.messages || [];
      const processed = messages.map((msg) => {
        try {
          const decoded = atob(msg.message);
          const json = JSON.parse(decoded);
          return { ...json, topicId: TOPIC_ID, consensusTimestamp: msg.consensus_timestamp, sequenceNumber: msg.sequence_number };
        } catch { return null; }
      }).filter(Boolean);
      setSubmissions(processed);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  const openHashscan = (consensusTimestamp) => {
    Linking.openURL(`https://hashscan.io/testnet/transaction/${consensusTimestamp}/message`);
  };

  const renderItem = ({ item }) => {
    const aqi = getValue(item, 'aqi');
    const aqiColor = getAqiColor(aqi);
    const temp = getValue(item, 'temperature');
    const humidity = getValue(item, 'humidity');
    const pm25 = getValue(item, 'pm25');
    const location = extractLocation(item);
    const timestamp = formatTimestamp(item.consensusTimestamp);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openHashscan(item.consensusTimestamp)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={[styles.aqiBadge, { borderColor: aqiColor }]}>
              <Text style={[styles.aqiBadgeText, { color: aqiColor }]}>{aqi}</Text>
            </View>
            <View>
              <Text style={[styles.aqiLabel, { color: aqiColor }]}>{getAqiLabel(aqi)}</Text>
              <Text style={styles.timestamp}>{timestamp}</Text>
            </View>
          </View>
          <View style={styles.seqBadge}>
            <Text style={styles.seqText}>#{item.sequenceNumber}</Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Temp</Text>
            <Text style={styles.statValue}>{temp}°C</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Humidity</Text>
            <Text style={styles.statValue}>{humidity}%</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>PM2.5</Text>
            <Text style={styles.statValue}>{pm25}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.locationText}>{location}</Text>
          <Text style={styles.viewLink}>View on HashScan →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading submissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Records</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{submissions.length}</Text>
        </View>
      </View>

      <FlatList
        data={submissions}
        renderItem={renderItem}
        keyExtractor={(item, idx) => `${item.sequenceNumber || idx}`}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No submissions found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  countBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { fontSize: 14, fontWeight: '700', color: colors.accent },
  list: { padding: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    ...shadowLight,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center' },
  aqiBadge: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2.5,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  aqiBadgeText: { fontSize: 15, fontWeight: '800' },
  aqiLabel: { fontSize: 15, fontWeight: '600' },
  timestamp: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  seqBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seqText: { fontSize: 12, fontWeight: '600', color: colors.accent },
  cardStats: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  statLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: { fontSize: 12, color: colors.textMuted },
  viewLink: { fontSize: 12, fontWeight: '600', color: colors.blue },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: colors.textMuted },
});

export default RecentSubmissionsScreen;
