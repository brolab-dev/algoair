# Air Quality Monitor Server

Simple Node.js server to receive and serve air quality data from ESP32.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### Air Quality Endpoints
- `GET /` - API information
- `GET /api/airquality` - Get latest sensor data
- `GET /api/airquality/history?limit=50` - Get historical data
- `POST /api/airquality` - Receive data from ESP32

### Hedera Blockchain Endpoints
- `POST /api/hedera/create-topic` - Create a new Hedera topic
- `POST /api/hedera/submit-data` - Submit air quality data to Hedera topic

## Using with ESP32

Update your ESP32 code to use this server:

```cpp
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/airquality";
```

Then in `sendDataToCloud()` function, use:
```cpp
http.begin(serverUrl);
http.addHeader("Content-Type", "application/json");
int httpResponseCode = http.POST(jsonString);
```

## Hedera Blockchain Integration

The server now includes endpoints for interacting with Hedera blockchain testnet.

### Create a Topic

```bash
curl -X POST http://localhost:3000/api/hedera/create-topic \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "0.0.xxxxx",
    "privateKey": "302e020100..."
  }'
```

Response:
```json
{
  "success": true,
  "topicId": "0.0.xxxxx",
  "message": "Topic created successfully"
}
```

### Submit Data to Topic

```bash
curl -X POST http://localhost:3000/api/hedera/submit-data \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "0.0.xxxxx",
    "privateKey": "302e020100...",
    "topicId": "0.0.xxxxx",
    "data": {
      "temperature": 25.5,
      "humidity": 60,
      "pm25": 12,
      "pm10": 18,
      "aqi": 45,
      "status": "NORMAL"
    }
  }'
```

Response:
```json
{
  "success": true,
  "message": "Data submitted to Hedera successfully",
  "topicId": "0.0.xxxxx",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Deployment

For production, deploy to:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS/GCP/Azure

Make sure to:
1. Use a proper database (MongoDB, PostgreSQL, etc.)
2. Add authentication
3. Use HTTPS
4. Add rate limiting
5. Secure Hedera credentials (use environment variables)

