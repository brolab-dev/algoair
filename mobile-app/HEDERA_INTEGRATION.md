# Hedera Blockchain Integration

This mobile app now includes integration with Hedera blockchain testnet using the Hedera Consensus Service (HCS).

**Note:** The mobile app communicates with your backend server, which handles all Hedera blockchain interactions. This approach is more secure and compatible with React Native.

## Features

- 📊 View current air quality data before submitting
- ➕ Create new topics on Hedera testnet
- 🚀 Submit air quality data to Hedera blockchain
- ⛓️ Immutable, verifiable record of environmental data
- 🔐 Secure submission using your Hedera account credentials

## Prerequisites

### 1. Start the Backend Server

Make sure your backend server is running with Hedera support:

```bash
cd server
npm install
npm start
```

The server should be running on `http://localhost:3000` (or your configured IP address).

### 2. Get a Hedera Testnet Account

1. Visit [Hedera Portal](https://portal.hedera.com)
2. Create a free testnet account
3. Note your **Account ID** (format: 0.0.xxxxx)
4. Note your **Private Key** (starts with 302e020100...)

### 3. Using the Hedera Screen

1. Open the mobile app
2. Tap the **Blockchain** tab at the bottom
3. Enter your Hedera testnet credentials:
   - Account ID
   - Private Key
   - Topic ID (optional - leave empty to create a new topic)

### 4. Create a Topic (First Time)

1. Enter your Account ID and Private Key
2. Tap **Create New Topic**
3. Wait for confirmation
4. Your new Topic ID will be displayed and saved

### 5. Submit Air Quality Data

1. Make sure you have entered your credentials and Topic ID
2. Review the current air quality data displayed
3. Tap **Submit Data to Hedera**
4. Wait for confirmation
5. Your data is now permanently recorded on the Hedera blockchain!

## What Data is Submitted?

Each submission includes:
- Timestamp
- Temperature (°C)
- Humidity (%)
- Gas level (ppm)
- Noise level (dB)
- PM2.5 (µg/m³)
- PM10 (µg/m³)
- Air Quality Index (AQI)
- Status (Normal/Warning/Danger)

## How It Works

### Architecture

The system uses a three-tier architecture:

1. **Mobile App** - User interface for viewing data and triggering blockchain submissions
2. **Backend Server** - Handles Hedera SDK operations and API requests
3. **Hedera Network** - Stores immutable records on the blockchain

### Hedera Consensus Service

The Hedera Consensus Service provides a decentralized, verifiable log of messages. When you submit air quality data:

1. The mobile app sends your credentials and data to the backend server
2. The backend server creates a JSON payload with all sensor readings
3. The server uses the Hedera SDK to submit the message to your topic
4. Hedera nodes reach consensus on the message order and timestamp
5. The message is permanently recorded on the Hedera network
6. Anyone can verify the data using the topic ID and message timestamp

### Benefits

- **Immutable**: Once submitted, data cannot be altered or deleted
- **Verifiable**: Anyone can verify the data on the Hedera network
- **Timestamped**: Each submission has a consensus timestamp
- **Decentralized**: No single point of failure
- **Low Cost**: Testnet is free; mainnet costs are minimal

## Viewing Your Data

You can view your submitted data using:

1. **Hedera Mirror Node Explorer**: https://hashscan.io/testnet
   - Search for your Topic ID
   - View all messages submitted to the topic

2. **Hedera Mirror Node API**: 
   ```
   https://testnet.mirrornode.hedera.com/api/v1/topics/{topicId}/messages
   ```

## Security Notes

- **Never share your private key** with anyone
- The private key is only stored in the app's memory during use
- For production use, consider using a secure key management solution
- The testnet is for testing only - use mainnet for production data

## Troubleshooting

### "Failed to create topic"
- Check that your Account ID and Private Key are correct
- Ensure you have testnet HBAR in your account
- Verify you're connected to the internet

### "Failed to submit data"
- Verify your Topic ID is correct
- Check that you have permission to submit to the topic
- Ensure your account has sufficient testnet HBAR

### "No air quality data available"
- Make sure the air quality sensor is running
- Check that the API server is accessible
- Verify the API_URL in HomeScreen.js is correct

## Next Steps

- Monitor your topic on HashScan
- Build applications that read from your topic
- Integrate with other Hedera services (tokens, smart contracts)
- Deploy to mainnet for production use

## Resources

- [Hedera Documentation](https://docs.hedera.com)
- [Hedera Consensus Service](https://docs.hedera.com/guides/docs/hedera-api/consensus-service)
- [Hedera SDK for JavaScript](https://github.com/hashgraph/hedera-sdk-js)
- [HashScan Explorer](https://hashscan.io)

