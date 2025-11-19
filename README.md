# IoT Air Quality Monitor with Hedera Blockchain

This project is a complete IoT solution for monitoring air quality, rewarding users for their data contributions, and visualizing the data on a public website. It uses an ESP32 (simulated in Wokwi) to send data to a mobile app, which then submits the data to the Hedera blockchain.

## 🌟 Features

- **ESP32 Sensor System:** Simulates an IoT device collecting air quality data (temperature, humidity, PM2.5, etc.).
- **React Native Mobile App:**
  - User registration and login.
  - Automatic creation of a Hedera wallet for each user.
  - Real-time display of air quality data.
  - Submission of data to the Hedera blockchain.
  - **Reward System:** Users earn `AIR` tokens for each submission and can claim them to their wallet.
- **Node.js Backend:**
  - Manages user authentication and data submissions.
  - Interacts with the Hedera network to send data and transfer tokens.
  - Serves the data explorer website.
- **Hedera Blockchain Integration:**
  - All data submissions are recorded on a public Hedera topic.
  - A custom `AIR` token is used to reward users for their contributions.
- **Data Explorer Website:**
  - A public website that displays all submitted data.
  - Includes a map with location markers for each submission.
  - A table with detailed information about each data point.

## 📁 Project Structure

```
air/
├── server/              # Node.js backend
│   ├── simple-server.js   # Main server file
│   ├── database.js        # SQLite database logic
│   ├── auth.js            # User authentication
│   ├── rewards.js         # Token reward logic
│   └── .env               # Environment variables
├── mobile-app/          # React Native mobile app
│   ├── App.js
│   └── screens/           # App screens
└── website/             # Data explorer website
    ├── index.html
    ├── script.js
    └── style.css
```

## 🚀 Quick Start

### Step 1: Set up the Backend Server

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up your environment variables:**
    *   Rename `.env.example` to `.env`.
    *   Fill in your Hedera account details (`HEDERA_ACCOUNT_ID`, `HEDERA_PRIVATE_KEY`, etc.).
4.  **Start the server:**
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:3000`.

### Step 2: Set up the Mobile App

1.  **Navigate to the mobile app directory:**
    ```bash
    cd mobile-app
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the app:**
    ```bash
    npm start
    ```
4.  Scan the QR code with the Expo Go app on your phone or run it in a simulator.

### Step 3: Use the App

1.  **Register a new account** in the mobile app.
2.  Go to the **"Blockchain"** tab.
3.  Click **"Submit to Blockchain"** to send data to the Hedera network.
4.  Click **"Claim All"** to receive your `AIR` token rewards.

### Step 4: View the Data Explorer Website

1.  Open your browser and go to **http://localhost:3000**.
2.  You will see a map and a table with all the data submitted to the Hedera topic.

## 🔗 Important Links

- **Data Explorer Website:** http://localhost:3000
- **Hedera Topic on HashScan:** [https://hashscan.io/testnet/topic/YOUR_TOPIC_ID](https://hashscan.io/testnet/topic/YOUR_TOPIC_ID)

## 📄 License

MIT License - Feel free to use this project for learning and development!

