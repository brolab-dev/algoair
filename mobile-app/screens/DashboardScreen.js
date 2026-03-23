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
  Animated,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { colors, getAqiColor, getAqiLabel, getAqiAdvice, getStatusColor, shadow, shadowLight } from '../theme';

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000/api/airquality'
  : 'http://192.168.1.128:3000/api/airquality';

const screenWidth = Dimensions.get('window').width;

// PM2.5 quality
const getPM25Quality = (v) => {
  if (v <= 12) return { label: 'Good', color: colors.good };
  if (v <= 35.4) return { label: 'Moderate', color: colors.moderate };
  if (v <= 55.4) return { label: 'Sensitive', color: colors.warning };
  if (v <= 150.4) return { label: 'Unhealthy', color: colors.danger };
  if (v <= 250.4) return { label: 'Very Unhealthy', color: colors.veryUnhealthy };
  return { label: 'Hazardous', color: colors.hazardous };
};

// PM10 quality
const getPM10Quality = (v) => {
  if (v <= 54) return { label: 'Good', color: colors.good };
  if (v <= 154) return { label: 'Moderate', color: colors.moderate };
  if (v <= 254) return { label: 'Sensitive', color: colors.warning };
  if (v <= 354) return { label: 'Unhealthy', color: colors.danger };
  if (v <= 424) return { label: 'Very Unhealthy', color: colors.veryUnhealthy };
  return { label: 'Hazardous', color: colors.hazardous };
};

// Gas quality
const getGasQuality = (v) => {
  if (v <= 200) return { label: 'Normal', color: colors.good };
  if (v <= 400) return { label: 'Moderate', color: colors.moderate };
  if (v <= 600) return { label: 'High', color: colors.warning };
  return { label: 'Very High', color: colors.danger };
};

const DashboardScreen = () => {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [expandedPollutant, setExpandedPollutant] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      if (json.temperature !== undefined) setData(json);
      else if (json.data) setData(json.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history?limit=20`);
      const json = await response.json();
      if (json.data) setHistory(json.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchHistory();
    const interval = setInterval(() => {
      fetchData();
      fetchHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchHistory()]);
    setRefreshing(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingDot} />
          <Text style={styles.loadingText}>Connecting to sensor...</Text>
        </View>
      </View>
    );
  }

  const aqi = data.aqi || 0;
  const aqiColor = getAqiColor(aqi);
  const pm25Val = data.pm25 !== undefined ? data.pm25 : 0;
  const pm10Val = data.pm10 !== undefined ? data.pm10 : 0;
  const gasVal = data.gas !== undefined ? data.gas : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Air Quality</Text>
            <Text style={styles.subtitle}>
              {lastUpdate ? `Updated ${formatTime(lastUpdate)}` : 'Live monitoring'}
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(data.status) }]} />
        </View>

        {/* AQI Hero */}
        <View style={styles.aqiHero}>
          <View style={[styles.aqiCircle, { borderColor: aqiColor }]}>
            <Text style={[styles.aqiValue, { color: aqiColor }]}>{aqi}</Text>
            <Text style={styles.aqiUnit}>AQI</Text>
          </View>
          <Text style={[styles.aqiLabel, { color: aqiColor }]}>{getAqiLabel(aqi)}</Text>
          <Text style={styles.aqiAdvice}>{getAqiAdvice(aqi)}</Text>

          {/* AQI Scale */}
          <View style={styles.scaleContainer}>
            <View style={styles.aqiScale}>
              <View style={[styles.scaleSegment, { backgroundColor: colors.good, flex: 1 }]} />
              <View style={[styles.scaleSegment, { backgroundColor: colors.moderate, flex: 1 }]} />
              <View style={[styles.scaleSegment, { backgroundColor: colors.warning, flex: 1 }]} />
              <View style={[styles.scaleSegment, { backgroundColor: colors.danger, flex: 1 }]} />
              <View style={[styles.scaleSegment, { backgroundColor: colors.veryUnhealthy, flex: 1 }]} />
              <View style={[styles.scaleSegment, { backgroundColor: colors.hazardous, flex: 1 }]} />
            </View>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleText}>0</Text>
              <Text style={styles.scaleText}>50</Text>
              <Text style={styles.scaleText}>100</Text>
              <Text style={styles.scaleText}>150</Text>
              <Text style={styles.scaleText}>200</Text>
              <Text style={styles.scaleText}>300</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EF444422' }]}>
              <Ionicons name="thermometer-outline" size={18} color={colors.danger} />
            </View>
            <Text style={styles.statValue}>{data.temperature?.toFixed(0) || '--'}°</Text>
            <Text style={styles.statLabel}>Temp</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F622' }]}>
              <Ionicons name="water-outline" size={18} color={colors.blue} />
            </View>
            <Text style={styles.statValue}>{data.humidity?.toFixed(0) || '--'}%</Text>
            <Text style={styles.statLabel}>Humidity</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F9731622' }]}>
              <Ionicons name="cloud-outline" size={18} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{data.gas || '--'}</Text>
            <Text style={styles.statLabel}>Gas ppm</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#A855F722' }]}>
              <Ionicons name="volume-high-outline" size={18} color={colors.veryUnhealthy} />
            </View>
            <Text style={styles.statValue}>{data.noise || '--'}</Text>
            <Text style={styles.statLabel}>Noise dB</Text>
          </View>
        </View>

        {/* Pollutants Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pollutants</Text>
        </View>

        {/* PM2.5 */}
        <TouchableOpacity
          style={styles.pollutantCard}
          onPress={() => setExpandedPollutant(expandedPollutant === 'pm25' ? null : 'pm25')}
          activeOpacity={0.7}
        >
          <View style={styles.pollutantTop}>
            <View style={styles.pollutantLeft}>
              <Text style={styles.pollutantName}>PM2.5</Text>
              <Text style={styles.pollutantValue}>
                {pm25Val} <Text style={styles.pollutantUnit}>ug/m3</Text>
              </Text>
            </View>
            <View style={[styles.qualityBadge, { backgroundColor: getPM25Quality(pm25Val).color + '22' }]}>
              <View style={[styles.qualityDot, { backgroundColor: getPM25Quality(pm25Val).color }]} />
              <Text style={[styles.qualityText, { color: getPM25Quality(pm25Val).color }]}>
                {getPM25Quality(pm25Val).label}
              </Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min((pm25Val / 250) * 100, 100)}%`, backgroundColor: getPM25Quality(pm25Val).color }]} />
          </View>
          {expandedPollutant === 'pm25' && (
            <View style={styles.pollutantDetail}>
              <Text style={styles.detailText}>
                Fine inhalable particles with diameters 2.5 micrometers and smaller. These can penetrate deep into the lungs and even enter the bloodstream.
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* PM10 */}
        <TouchableOpacity
          style={styles.pollutantCard}
          onPress={() => setExpandedPollutant(expandedPollutant === 'pm10' ? null : 'pm10')}
          activeOpacity={0.7}
        >
          <View style={styles.pollutantTop}>
            <View style={styles.pollutantLeft}>
              <Text style={styles.pollutantName}>PM10</Text>
              <Text style={styles.pollutantValue}>
                {pm10Val} <Text style={styles.pollutantUnit}>ug/m3</Text>
              </Text>
            </View>
            <View style={[styles.qualityBadge, { backgroundColor: getPM10Quality(pm10Val).color + '22' }]}>
              <View style={[styles.qualityDot, { backgroundColor: getPM10Quality(pm10Val).color }]} />
              <Text style={[styles.qualityText, { color: getPM10Quality(pm10Val).color }]}>
                {getPM10Quality(pm10Val).label}
              </Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min((pm10Val / 424) * 100, 100)}%`, backgroundColor: getPM10Quality(pm10Val).color }]} />
          </View>
          {expandedPollutant === 'pm10' && (
            <View style={styles.pollutantDetail}>
              <Text style={styles.detailText}>
                Inhalable particles with diameters 10 micrometers and smaller. Sources include crushing/grinding operations and dust stirred up by vehicles.
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* VOC */}
        <TouchableOpacity
          style={styles.pollutantCard}
          onPress={() => setExpandedPollutant(expandedPollutant === 'gas' ? null : 'gas')}
          activeOpacity={0.7}
        >
          <View style={styles.pollutantTop}>
            <View style={styles.pollutantLeft}>
              <Text style={styles.pollutantName}>VOC / Gas</Text>
              <Text style={styles.pollutantValue}>
                {gasVal} <Text style={styles.pollutantUnit}>ppm</Text>
              </Text>
            </View>
            <View style={[styles.qualityBadge, { backgroundColor: getGasQuality(gasVal).color + '22' }]}>
              <View style={[styles.qualityDot, { backgroundColor: getGasQuality(gasVal).color }]} />
              <Text style={[styles.qualityText, { color: getGasQuality(gasVal).color }]}>
                {getGasQuality(gasVal).label}
              </Text>
            </View>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min((gasVal / 600) * 100, 100)}%`, backgroundColor: getGasQuality(gasVal).color }]} />
          </View>
          {expandedPollutant === 'gas' && (
            <View style={styles.pollutantDetail}>
              <Text style={styles.detailText}>
                Volatile Organic Compounds are gases emitted from certain solids or liquids. Common sources include paints, cleaning supplies, and building materials.
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Trends */}
        {history.length >= 2 && (() => {
          const recent = history.slice(-6);
          const pm25Data = recent.map(h => (h.pm25 !== undefined && h.pm25 !== null) ? Number(h.pm25) : 0);
          const aqiData = recent.map(h => (h.aqi !== undefined && h.aqi !== null) ? Number(h.aqi) : 0);
          const labels = recent.map(h => h.timestamp ? formatTime(h.timestamp) : '');
          // Ensure at least one non-zero value so chart renders
          const hasPm25 = pm25Data.some(v => v > 0);
          const hasAqi = aqiData.some(v => v > 0);

          return (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trends</Text>
              </View>

              {hasPm25 && (
                <View style={[styles.chartCard, shadowLight]}>
                  <Text style={styles.chartTitle}>PM2.5</Text>
                  <LineChart
                    data={{
                      labels,
                      datasets: [{ data: pm25Data }],
                    }}
                    width={screenWidth - 56}
                    height={180}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                      labelColor: () => colors.textMuted,
                      style: { borderRadius: 12 },
                      propsForDots: { r: '3', strokeWidth: '2', stroke: colors.accent },
                      fillShadowGradient: colors.accent,
                      fillShadowGradientOpacity: 0.2,
                    }}
                    bezier
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLines={false}
                    style={{ borderRadius: 12 }}
                  />
                </View>
              )}

              {hasAqi && (
                <View style={[styles.chartCard, shadowLight]}>
                  <Text style={styles.chartTitle}>AQI</Text>
                  <LineChart
                    data={{
                      labels,
                      datasets: [{ data: aqiData }],
                    }}
                    width={screenWidth - 56}
                    height={180}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      labelColor: () => colors.textMuted,
                      style: { borderRadius: 12 },
                      propsForDots: { r: '3', strokeWidth: '2', stroke: colors.blue },
                      fillShadowGradient: colors.blue,
                      fillShadowGradientOpacity: 0.2,
                    }}
                    bezier
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLines={false}
                    style={{ borderRadius: 12 }}
                  />
                </View>
              )}
            </>
          );
        })()}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
    marginBottom: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // AQI Hero
  aqiHero: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    backgroundColor: colors.card,
    borderRadius: 20,
    alignItems: 'center',
    ...shadow,
  },
  aqiCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  aqiValue: {
    fontSize: 48,
    fontWeight: '800',
  },
  aqiUnit: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: -4,
  },
  aqiLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  aqiAdvice: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  scaleContainer: {
    width: '100%',
  },
  aqiScale: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  scaleSegment: {
    height: '100%',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleText: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // Quick Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    ...shadowLight,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Pollutant Cards
  pollutantCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    ...shadowLight,
  },
  pollutantTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pollutantLeft: {},
  pollutantName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  pollutantValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pollutantUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBg: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  pollutantDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Charts
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
});

export { API_URL };
export default DashboardScreen;
