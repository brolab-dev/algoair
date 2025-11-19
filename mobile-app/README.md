# Air Quality Monitor Mobile App

React Native mobile app for monitoring air quality data from ESP32 sensor.

**Note:** This app is designed for mobile devices (iOS/Android) using Expo Go. Web support is experimental.

## Features

- 📊 Real-time air quality monitoring
- 🔄 Auto-refresh every 5 seconds
- 📈 Temperature trend chart
- 🎨 Beautiful dark theme UI
- 📱 Works on iOS and Android
- 🔔 Visual status indicators (Normal/Warning/Danger)
- ⛓️ **NEW: Hedera Blockchain Integration** - Submit air quality data to Hedera testnet
- 🚀 Create topics and submit immutable environmental data records

## Setup

### Prerequisites
- Node.js installed
- Expo CLI installed: `npm install -g expo-cli`
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Installation

1. Navigate to mobile-app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Update API URL in `screens/HomeScreen.js`:
```javascript
export const API_URL = 'http://YOUR_SERVER_IP:3000/api/airquality';
```

4. Start the app:
```bash
npm start
```

5. **Scan QR code with Expo Go app on your phone**
   - Download Expo Go from App Store (iOS) or Play Store (Android)
   - Scan the QR code shown in the terminal
   - The app will load on your phone

**Note:** For best experience, use the mobile app on a physical device. Web version may have compatibility issues.

**Troubleshooting:** If you encounter any issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Configuration

### Using Custom Server
```javascript
const API_URL = 'http://192.168.1.100:3000/api/airquality';
```

### Using Firebase
```javascript
const API_URL = 'https://your-project-id-default-rtdb.firebaseio.com/airquality/sensor1.json';
```

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

## Customization

### Change Theme Colors
Edit the `styles` object in `App.js`:
```javascript
backgroundColor: '#000', // Main background
statusCard: { backgroundColor: '#34C759' }, // Status color
metricCard: { backgroundColor: '#1C1C1E' }, // Card background
```

### Adjust Refresh Interval
Change the interval in `useEffect`:
```javascript
const interval = setInterval(() => {
  fetchData();
}, 5000); // 5000ms = 5 seconds
```

### Add Notifications
Install expo-notifications:
```bash
expo install expo-notifications
```

Then add notification logic when status changes to DANGER.

## Troubleshooting

### "Network request failed"
- Make sure your phone and server are on the same WiFi network
- Check the API_URL is correct
- For Firebase, ensure database rules allow reads

### "Unable to resolve module"
```bash
npm install
expo start -c
```

### Charts not showing
```bash
npm install react-native-svg react-native-chart-kit
```

## Screenshots

The app displays:
- Current air quality status (Normal/Warning/Danger)
- Temperature and humidity readings
- Gas level (ppm)
- Noise level (dB)
- Temperature trend chart
- Last update timestamp

## Hedera Blockchain Integration

The app now includes a **Blockchain** tab that allows you to submit air quality data to the Hedera testnet using the Hedera Consensus Service.

### Quick Start

1. Get a free Hedera testnet account at [portal.hedera.com](https://portal.hedera.com)
2. Open the app and tap the **Blockchain** tab
3. Enter your Account ID and Private Key
4. Create a new topic or use an existing one
5. Submit your air quality data to the blockchain!

For detailed instructions, see [HEDERA_INTEGRATION.md](./HEDERA_INTEGRATION.md)

## Next Steps

- [x] Hedera blockchain integration
- [ ] Add push notifications for alerts
- [ ] Add historical data view
- [ ] Add multiple sensor support
- [ ] Add user authentication
- [ ] Add data export feature
- [ ] Add custom alert thresholds

