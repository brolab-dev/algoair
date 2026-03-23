import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { API_URL } from './HomeScreen';

// PM2.5 quality assessment
const getPM25Quality = (value) => {
  if (value <= 12) return { label: 'Good Quality', color: '#34C759' };
  if (value <= 35.4) return { label: 'Moderate', color: '#FFCC00' };
  if (value <= 55.4) return { label: 'Unhealthy for Sensitive', color: '#FF9500' };
  if (value <= 150.4) return { label: 'Unhealthy', color: '#FF3B30' };
  if (value <= 250.4) return { label: 'Very Unhealthy', color: '#8B00FF' };
  return { label: 'Hazardous', color: '#7E0023' };
};

// PM10 quality assessment
const getPM10Quality = (value) => {
  if (value <= 54) return { label: 'Good Quality', color: '#34C759' };
  if (value <= 154) return { label: 'Moderate', color: '#FFCC00' };
  if (value <= 254) return { label: 'Unhealthy for Sensitive', color: '#FF9500' };
  if (value <= 354) return { label: 'Unhealthy', color: '#FF3B30' };
  if (value <= 424) return { label: 'Very Unhealthy', color: '#8B00FF' };
  return { label: 'Hazardous', color: '#7E0023' };
};

// VOC/Gas quality assessment
const getGasQuality = (value) => {
  if (value <= 200) return { label: 'Normal Range', color: '#34C759' };
  if (value <= 400) return { label: 'Moderate', color: '#FFCC00' };
  if (value <= 600) return { label: 'High', color: '#FF9500' };
  return { label: 'Very High', color: '#FF3B30' };
};

const PollutantDetailsScreen = () => {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      if (json.temperature !== undefined) {
        setData(json);
      } else if (json.data) {
        setData(json.data);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatTime = (date) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const pm25Val = data.pm25 !== undefined ? data.pm25 : 0;
  const pm10Val = data.pm10 !== undefined ? data.pm10 : 0;
  const gasVal = data.gas !== undefined ? data.gas : 0;
  const pm25Quality = getPM25Quality(pm25Val);
  const pm10Quality = getPM10Quality(pm10Val);
  const gasQuality = getGasQuality(gasVal);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pollutant Details</Text>
          <Text style={styles.headerSubtitle}>Detailed breakdown of air pollutants</Text>
        </View>

        {/* PM2.5 Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.pollutantName}>PM2.5</Text>
              <View style={[styles.qualityBadge, { backgroundColor: pm25Quality.color }]}>
                <Text style={styles.qualityText}>{pm25Quality.label}</Text>
              </View>
            </View>
            <Text style={styles.valueText}>
              {pm25Val} <Text style={styles.unitText}>ug/m3</Text>
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.questionText}>What is PM2.5?</Text>
            <Text style={styles.descriptionText}>
              Fine inhalable particles with diameters 2.5 micrometers and smaller. These can penetrate deep into the lungs and even enter the bloodstream.
            </Text>
          </View>
        </View>

        {/* PM10 Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.pollutantName}>PM10</Text>
              <View style={[styles.qualityBadge, { backgroundColor: pm10Quality.color }]}>
                <Text style={styles.qualityText}>{pm10Quality.label}</Text>
              </View>
            </View>
            <Text style={styles.valueText}>
              {pm10Val} <Text style={styles.unitText}>ug/m3</Text>
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.questionText}>What is PM10?</Text>
            <Text style={styles.descriptionText}>
              Inhalable particles with diameters 10 micrometers and smaller. Sources include crushing/grinding operations and dust stirred up by vehicles.
            </Text>
          </View>
        </View>

        {/* VOC / Gas Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.pollutantName}>VOC / Gas</Text>
              <View style={[styles.qualityBadge, { backgroundColor: gasQuality.color }]}>
                <Text style={styles.qualityText}>{gasQuality.label}</Text>
              </View>
            </View>
            <Text style={styles.valueText}>
              {gasVal} <Text style={styles.unitText}>ppm</Text>
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.questionText}>What are VOCs?</Text>
            <Text style={styles.descriptionText}>
              Volatile Organic Compounds are gases emitted from certain solids or liquids. Common sources include paints, cleaning supplies, and building materials.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerDevice}>Monitoring via {data.device_id || 'ESP32_001'}</Text>
          <Text style={styles.footerTime}>Last updated: {formatTime(lastUpdate)}</Text>
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
  loadingText: {
    color: '#333',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 15,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollutantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  valueText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  unitText: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#999',
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  footerDevice: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  footerTime: {
    fontSize: 12,
    color: '#BBB',
  },
});

export default PollutantDetailsScreen;
