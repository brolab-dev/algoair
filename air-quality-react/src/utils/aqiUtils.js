// EPA AQI breakpoints, colors, and health information
const AQI_LEVELS = [
  { min: 0, max: 50, label: 'Good', color: '#55a84f', bg: '#e8f5e9', textColor: '#2e7d32', description: 'Air quality is satisfactory, and air pollution poses little or no risk.' },
  { min: 51, max: 100, label: 'Moderate', color: '#a3c853', bg: '#fff9c4', textColor: '#f9a825', description: 'Air quality is acceptable. However, there may be a risk for some people.' },
  { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', color: '#fff833', bg: '#fff3e0', textColor: '#ef6c00', description: 'Members of sensitive groups may experience health effects.' },
  { min: 151, max: 200, label: 'Unhealthy', color: '#f29c33', bg: '#fce4ec', textColor: '#c62828', description: 'Everyone may begin to experience health effects.' },
  { min: 201, max: 300, label: 'Very Unhealthy', color: '#e93f33', bg: '#f3e5f5', textColor: '#6a1b9a', description: 'Health warnings of emergency conditions. Everyone is more likely to be affected.' },
  { min: 301, max: 500, label: 'Hazardous', color: '#af2d24', bg: '#efebe9', textColor: '#4e342e', description: 'Health alert: everyone may experience more serious health effects.' },
];

export const getAqiLevel = (aqi) => {
  const val = Number(aqi);
  if (isNaN(val) || val < 0) return AQI_LEVELS[0];
  for (const level of AQI_LEVELS) {
    if (val <= level.max) return level;
  }
  return AQI_LEVELS[AQI_LEVELS.length - 1];
};

export const getAqiColor = (aqi) => getAqiLevel(aqi).color;

export const getHealthRecommendations = (aqi) => {
  const val = Number(aqi);
  if (isNaN(val) || val <= 50) {
    return [
      { icon: 'window', text: 'Open your windows', detail: 'Great air for ventilation' },
      { icon: 'outdoor', text: 'Enjoy outdoor activities', detail: 'Air quality is ideal' },
      { icon: 'mask', text: 'No mask needed', detail: 'Air is clean and safe' },
    ];
  }
  if (val <= 100) {
    return [
      { icon: 'window', text: 'Ventilation is OK', detail: 'Acceptable for most people' },
      { icon: 'outdoor', text: 'Outdoor activities OK', detail: 'Sensitive groups should limit prolonged outdoor exertion' },
      { icon: 'mask', text: 'No mask needed', detail: 'Generally safe for most people' },
    ];
  }
  if (val <= 150) {
    return [
      { icon: 'window', text: 'Close your windows', detail: 'Use air purifier if available' },
      { icon: 'outdoor', text: 'Reduce outdoor activity', detail: 'Sensitive groups should avoid prolonged outdoor exertion' },
      { icon: 'mask', text: 'Wear a mask outdoors', detail: 'Recommended for sensitive groups' },
    ];
  }
  return [
    { icon: 'window', text: 'Keep windows closed', detail: 'Use air purifier indoors' },
    { icon: 'outdoor', text: 'Avoid outdoor activity', detail: 'Everyone should limit outdoor exertion' },
    { icon: 'mask', text: 'Wear N95 mask', detail: 'Essential for anyone going outdoors' },
  ];
};

export default AQI_LEVELS;
