import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

// Configuration - Detect platform and use appropriate URL
const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000/api/airquality'  // For web browser testing
  : 'http://192.168.1.128:3000/api/airquality';  // For mobile devices

const HomeScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch latest data
  const fetchData = async () => {
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      
      // Handle Firebase response format
      if (json.temperature !== undefined) {
        setData(json);
      } else if (json.data) {
        // Handle custom server response format
        setData(json.data);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Fetch historical data
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history?limit=20`);
      const json = await response.json();
      if (json.data) {
        setHistory(json.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchData();
    fetchHistory();
    
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchHistory();
    setRefreshing(false);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'DANGER':
        return '#FF3B30';
      case 'WARNING':
        return '#FF9500';
      case 'NORMAL':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  // Get air quality description
  const getAirQualityDescription = (status) => {
    switch (status?.toUpperCase()) {
      case 'DANGER':
        return 'Poor - Take action!';
      case 'WARNING':
        return 'Moderate - Be cautious';
      case 'NORMAL':
        return 'Good - All clear';
      default:
        return 'Unknown';
    }
  };

  // Get AQI color based on value
  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#34C759';      // Good - Green
    if (aqi <= 100) return '#FFCC00';     // Moderate - Yellow
    if (aqi <= 150) return '#FF9500';     // Unhealthy for Sensitive - Orange
    if (aqi <= 200) return '#FF3B30';     // Unhealthy - Red
    if (aqi <= 300) return '#8B00FF';     // Very Unhealthy - Purple
    return '#7E0023';                      // Hazardous - Maroon
  };

  // Get AQI description
  const getAQIDescription = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  // Get AQI health impact text
  const getAQIHealthImpact = (aqi) => {
    if (aqi <= 50) return 'Air quality is satisfactory';
    if (aqi <= 100) return 'Acceptable for most people';
    if (aqi <= 150) return 'Sensitive groups may experience effects';
    if (aqi <= 200) return 'Everyone may experience effects';
    if (aqi <= 300) return 'Health alert: everyone may experience serious effects';
    return 'Health warnings of emergency conditions';
  };

  // Get status emoji
  const getStatusEmoji = (status) => {
    switch (status?.toUpperCase()) {
      case 'DANGER':
        return '😷';
      case 'WARNING':
        return '😐';
      case 'NORMAL':
        return '😊';
      default:
        return '😶';
    }
  };

  // Get status text for banner
  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'DANGER':
        return 'Poor Air Quality';
      case 'WARNING':
        return 'Moderate Air Quality';
      case 'NORMAL':
        return 'Good Air Quality';
      default:
        return 'Unknown Air Quality';
    }
  };

  // Format time for chart labels
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🌿</Text>
            </View>
            <View>
              <Text style={styles.title}>Air Quality</Text>
              <Text style={styles.subtitle}>Live monitoring</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshIcon}>🔄</Text>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(data.status) }]}>
          <Text style={styles.statusEmoji}>{getStatusEmoji(data.status)}</Text>
          <Text style={styles.statusBannerText}>● {getStatusText(data.status)}</Text>
        </View>

        {/* AQI Section */}
        <View style={styles.aqiSection}>
          <Text style={styles.sectionLabel}>AIR QUALITY INDEX</Text>

          {/* Circular AQI Badge */}
          <View style={[styles.aqiBadge, { backgroundColor: getAQIColor(data.aqi || 0) }]}>
            <Text style={styles.aqiValue}>{data.aqi || 0}</Text>
          </View>

          {/* AQI Description */}
          <Text style={styles.aqiDescription}>{getAQIDescription(data.aqi || 0)}</Text>
          <Text style={styles.aqiHealthImpact}>{getAQIHealthImpact(data.aqi || 0)}</Text>

          {/* AQI Scale */}
          <Text style={styles.scaleLabel}>AQI Scale</Text>
          <View style={styles.aqiScale}>
            <View style={[styles.scaleSegment, { backgroundColor: '#34C759', flex: 1 }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#FFCC00', flex: 1 }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#FF9500', flex: 1 }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#FF3B30', flex: 1 }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#8B00FF', flex: 1 }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#7E0023', flex: 1 }]} />
          </View>
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleText}>0</Text>
            <Text style={styles.scaleText}>50</Text>
            <Text style={styles.scaleText}>100</Text>
            <Text style={styles.scaleText}>150</Text>
            <Text style={styles.scaleText}>200</Text>
            <Text style={styles.scaleText}>300</Text>
            <Text style={styles.scaleText}>500</Text>
          </View>
        </View>

        {/* Particulate Matter Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🌫</Text>
            <Text style={styles.sectionTitle}>PARTICULATE MATTER</Text>
          </View>
          <View style={styles.pmGrid}>
            {/* PM2.5 Card */}
            <View style={styles.pmCard}>
              <View style={[styles.pmIconCircle, { backgroundColor: '#2d6a4f' }]}>
                <Text style={styles.pmIconText}>🌿</Text>
              </View>
              <View style={styles.pmInfo}>
                <Text style={styles.pmLabel}>PM2.5</Text>
                <Text style={styles.pmValue}>
                  {data.pm25 !== undefined ? data.pm25 : '--'} <Text style={styles.pmUnit}>µg/m³</Text>
                </Text>
              </View>
            </View>

            {/* PM10 Card */}
            <View style={styles.pmCard}>
              <View style={[styles.pmIconCircle, { backgroundColor: '#2d6a4f' }]}>
                <Text style={styles.pmIconText}>🌿</Text>
              </View>
              <View style={styles.pmInfo}>
                <Text style={styles.pmLabel}>PM10</Text>
                <Text style={styles.pmValue}>
                  {data.pm10 !== undefined ? data.pm10 : '--'} <Text style={styles.pmUnit}>µg/m³</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Environmental Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ENVIRONMENTAL</Text>
          <View style={styles.envGrid}>
            {/* Temperature Card */}
            <View style={styles.envCard}>
              <View style={[styles.envIconCircle, { backgroundColor: '#FFE5E5' }]}>
                <Text style={styles.envIcon}>🌡️</Text>
              </View>
              <Text style={styles.envLabel}>Temperature</Text>
              <Text style={styles.envValue}>
                {data.temperature?.toFixed(0) || '--'} <Text style={styles.envUnit}>°C</Text>
              </Text>
            </View>

            {/* Humidity Card */}
            <View style={styles.envCard}>
              <View style={[styles.envIconCircle, { backgroundColor: '#E5F3FF' }]}>
                <Text style={styles.envIcon}>💧</Text>
              </View>
              <Text style={styles.envLabel}>Humidity</Text>
              <Text style={styles.envValue}>
                {data.humidity?.toFixed(0) || '--'} <Text style={styles.envUnit}>%</Text>
              </Text>
            </View>

            {/* Gas Card */}
            <View style={styles.envCard}>
              <View style={[styles.envIconCircle, { backgroundColor: '#FFF3E5' }]}>
                <Text style={styles.envIcon}>☁️</Text>
              </View>
              <Text style={styles.envLabel}>Gas</Text>
              <Text style={styles.envValue}>
                {data.gas || '--'} <Text style={styles.envUnit}>ppm</Text>
              </Text>
            </View>

            {/* Noise Card */}
            <View style={styles.envCard}>
              <View style={[styles.envIconCircle, { backgroundColor: '#F3E5FF' }]}>
                <Text style={styles.envIcon}>🔊</Text>
              </View>
              <Text style={styles.envLabel}>Noise</Text>
              <Text style={styles.envValue}>
                {data.noise || '--'} <Text style={styles.envUnit}>dB</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Trends Section */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TRENDS</Text>

            {/* PM2.5 Trend Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>PM2.5 (Last 30s)</Text>
              <LineChart
                data={{
                  labels: history.slice(-4).map(h => formatTime(h.timestamp)),
                  datasets: [{
                    data: history.slice(-4).map(h => h.pm25 !== undefined ? h.pm25 : 0)
                  }]
                }}
                width={Dimensions.get('window').width - 60}
                height={200}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#4CAF50"
                  },
                  fillShadowGradient: '#4CAF50',
                  fillShadowGradientOpacity: 0.3,
                }}
                bezier
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                style={styles.chart}
              />
            </View>

            {/* AQI Trend Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>AQI (Last 30s)</Text>
              <LineChart
                data={{
                  labels: history.slice(-4).map(h => formatTime(h.timestamp)),
                  datasets: [{
                    data: history.slice(-4).map(h => h.aqi !== undefined ? h.aqi : 0)
                  }]
                }}
                width={Dimensions.get('window').width - 60}
                height={200}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#2196F3"
                  },
                  fillShadowGradient: '#2196F3',
                  fillShadowGradientOpacity: 0.3,
                }}
                bezier
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                style={styles.chart}
              />
            </View>
          </View>
        )}
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
  // Header Styles
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
    backgroundColor: '#2d6a4f',
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  refreshIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  refreshText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Status Banner Styles
  statusBanner: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // AQI Section Styles
  aqiSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 15,
  },
  aqiBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  aqiValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  aqiDescription: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  aqiHealthImpact: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  scaleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  aqiScale: {
    flexDirection: 'row',
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  scaleSegment: {
    height: '100%',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  scaleText: {
    fontSize: 10,
    color: '#999',
  },
  // Section Styles
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.5,
  },
  // Particulate Matter Styles
  pmGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pmCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pmIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pmIconText: {
    fontSize: 24,
  },
  pmInfo: {
    flex: 1,
  },
  pmLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  pmValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  pmUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#999',
  },
  // Environmental Styles
  envGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  envCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  envIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  envIcon: {
    fontSize: 20,
  },
  envLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  envValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  envUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#999',
  },
  // Chart Styles
  chartCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    borderRadius: 12,
  },
});

export { API_URL };
export default HomeScreen;

