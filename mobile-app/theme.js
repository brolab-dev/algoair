export const colors = {
  // Base
  background: '#0F172A',
  card: '#1E293B',
  cardLight: '#273549',
  border: '#334155',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Accent
  accent: '#22C55E',
  accentDark: '#16A34A',
  accentLight: '#22C55E22',

  // Status
  good: '#22C55E',
  moderate: '#EAB308',
  warning: '#F97316',
  danger: '#EF4444',
  veryUnhealthy: '#A855F7',
  hazardous: '#DC2626',

  // Utility
  blue: '#3B82F6',
  blueLight: '#3B82F622',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',
};

export const getAqiColor = (aqi) => {
  if (aqi == null) return colors.textMuted;
  if (aqi <= 50) return colors.good;
  if (aqi <= 100) return colors.moderate;
  if (aqi <= 150) return colors.warning;
  if (aqi <= 200) return colors.danger;
  if (aqi <= 300) return colors.veryUnhealthy;
  return colors.hazardous;
};

export const getAqiLabel = (aqi) => {
  if (aqi == null) return 'Unknown';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

export const getAqiAdvice = (aqi) => {
  if (aqi == null) return 'No data available';
  if (aqi <= 50) return 'Air quality is satisfactory. Enjoy outdoor activities.';
  if (aqi <= 100) return 'Acceptable. Sensitive individuals should limit prolonged outdoor exertion.';
  if (aqi <= 150) return 'Sensitive groups should reduce outdoor activity.';
  if (aqi <= 200) return 'Everyone should reduce prolonged outdoor exertion.';
  if (aqi <= 300) return 'Avoid outdoor activities. Keep windows closed.';
  return 'Stay indoors. Use air purifiers. Seek medical attention if needed.';
};

export const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'DANGER': return colors.danger;
    case 'WARNING': return colors.warning;
    case 'NORMAL': return colors.good;
    default: return colors.textMuted;
  }
};

export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
};

export const shadowLight = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
};
