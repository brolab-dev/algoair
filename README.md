# AlgoAir - Decentralized Air Quality Monitoring

[![Demo Video](https://img.youtube.com/vi/vrdrZb76YPI/0.jpg)](https://youtube.com/shorts/vrdrZb76YPI)

Winner of the DePIN Track at Hedera Future Ascension.

AlgoAir is a decentralized air quality monitoring platform that combines IoT sensors, a mobile app, and the Hedera blockchain to let anyone monitor, submit, and earn rewards for real-time environmental data.

## 3 Core Features

### 1. Real-Time IoT Monitoring
- $25 ESP32 sensor kit measuring 6 metrics: Temperature, Humidity, PM2.5, PM10, Gas/VOC, Noise
- AQI calculation following EPA standards (0-500 scale)
- Live data every 60 seconds via WiFi

### 2. Blockchain-Verified Data
- Every submission recorded immutably on Hedera
- Public shared topic for community data
- Verify any data point on HashScan

### 3. AIR Token Rewards
- Custom AIR token on Hedera network
- 10 AIR tokens per verified submission
- Automatic wallet creation on registration
- Claim rewards individually or in bulk

## Project Structure

```
algoair/
├── server/                # Node.js backend
│   ├── simple-server.js   # Main server (15+ API endpoints)
│   ├── auth.js            # JWT authentication
│   ├── database.js        # SQLite database
│   └── rewards.js         # AIR token reward logic
├── mobile-app/            # React Native + Expo
│   ├── screens/           # 8 app screens
│   └── App.js             # Entry point
├── air-quality-react/     # React web dashboard
│   └── src/components/    # MUI components, charts, map
├── website/               # Data explorer (served by backend)
└── src/main.cpp           # ESP32 Arduino firmware
```

## Quick Start

### 1. Backend Server
```bash
cd server
npm install
# Configure .env with Hedera credentials
npm start
```
Server runs at `http://localhost:3000`

### 2. Mobile App
```bash
cd mobile-app
npm install
npm start
```
Scan QR code with Expo Go

### 3. Web Dashboard
```bash
cd air-quality-react
npm install
npm start
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Hardware | ESP32, DHT22, MQ-135, PM sensors |
| Backend | Node.js, Express, SQLite, Hedera SDK |
| Mobile | React Native, Expo, React Navigation |
| Web | React, Material-UI, Leaflet, Recharts |
| Blockchain | Hedera Hashgraph Testnet |

## License

MIT
