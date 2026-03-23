import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import MapView, { Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { colors, getAqiColor, getAqiLabel, shadowLight } from '../theme';

const TOPIC_ID = '0.0.8218381';
const MIRROR_NODE_URL = `https://testnet.mirrornode.hedera.com/api/v1/topics/${TOPIC_ID}/messages`;

const getLatLng = (s) => {
  if (s.latitude != null && s.longitude != null) {
    return { latitude: Number(s.latitude), longitude: Number(s.longitude) };
  }
  if (typeof s.location === 'object' && s.location) {
    const lat = s.location.lat ?? s.location.latitude;
    const lng = s.location.lng ?? s.location.longitude;
    if (lat != null && lng != null) return { latitude: Number(lat), longitude: Number(lng) };
  }
  if (typeof s.location === 'string' && s.location.includes(',')) {
    const [latStr, lngStr] = s.location.split(',').map((t) => t.trim());
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { latitude: lat, longitude: lng };
  }
  if (s.data) return getLatLng(s.data);
  return null;
};

const getValue = (s, key) => {
  if (s[key] != null) return s[key];
  if (s.data && s.data[key] != null) return s.data[key];
  return undefined;
};

const SensorMapScreen = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);

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

  const markers = submissions
    .map((s, idx) => {
      const coords = getLatLng(s);
      if (!coords) return null;
      const aqi = getValue(s, 'aqi');
      const temp = getValue(s, 'temperature');
      const humidity = getValue(s, 'humidity');
      const pm25 = getValue(s, 'pm25');
      return { coords, aqi, temp, humidity, pm25, key: idx };
    })
    .filter(Boolean);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading sensor data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sensor Map</Text>
        <View style={styles.countBadge}>
          <View style={styles.countDot} />
          <Text style={styles.countText}>{markers.length} sensors</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 16.0544,
            longitude: 108.2022,
            latitudeDelta: 15,
            longitudeDelta: 15,
          }}
          customMapStyle={darkMapStyle}
        >
          {markers.map((m) => (
            <Circle
              key={m.key}
              center={m.coords}
              radius={15000}
              fillColor={getAqiColor(m.aqi) + '99'}
              strokeColor={getAqiColor(m.aqi)}
              strokeWidth={2}
              tappable
              onPress={() => setSelectedMarker(m)}
            />
          ))}
        </MapView>
      </View>

      {selectedMarker && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.aqiBadge, { borderColor: getAqiColor(selectedMarker.aqi) }]}>
              <Text style={[styles.aqiBadgeText, { color: getAqiColor(selectedMarker.aqi) }]}>
                {selectedMarker.aqi ?? '--'}
              </Text>
            </View>
            <View style={styles.infoDetails}>
              <Text style={[styles.infoLabel, { color: getAqiColor(selectedMarker.aqi) }]}>
                {getAqiLabel(selectedMarker.aqi)}
              </Text>
              <Text style={styles.infoCoords}>
                {selectedMarker.coords.latitude.toFixed(4)}, {selectedMarker.coords.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
          <View style={styles.infoStats}>
            <StatItem label="Temp" value={`${selectedMarker.temp ?? '--'}°C`} />
            <View style={styles.statDivider} />
            <StatItem label="Humidity" value={`${selectedMarker.humidity ?? '--'}%`} />
            <View style={styles.statDivider} />
            <StatItem label="PM2.5" value={`${selectedMarker.pm25 ?? '--'}`} />
          </View>
        </View>
      )}
    </View>
  );
};

const StatItem = ({ label, value }) => (
  <View style={styles.infoStat}>
    <Text style={styles.infoStatLabel}>{label}</Text>
    <Text style={styles.infoStatValue}>{value}</Text>
  </View>
);

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#0e1626' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
];

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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginRight: 6 },
  countText: { fontSize: 12, fontWeight: '600', color: colors.accent },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadowLight,
  },
  map: { flex: 1 },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    ...shadowLight,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  aqiBadge: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 3,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  aqiBadgeText: { fontSize: 18, fontWeight: '800' },
  infoDetails: { flex: 1 },
  infoLabel: { fontSize: 16, fontWeight: '700' },
  infoCoords: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  infoStats: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  infoStat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border },
  infoStatLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  infoStatValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
});

export default SensorMapScreen;
